
/* ==================================
   SOLVER — Shared JavaScript
================================== */

"use strict";

/* ---------- Safe Local Storage ---------- */

const SolverStorage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error(`Solver storage read error (${key}):`, error);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Solver storage write error (${key}):`, error);
      showToast("ذخیره اطلاعات انجام نشد.", "error");
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Solver storage remove error (${key}):`, error);
      return false;
    }
  }
};

/* ---------- Toast Notifications ---------- */

function showToast(message, type = "info", duration = 3000) {
  let container = document.querySelector(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();

    if (container && container.children.length === 0) {
      container.remove();
    }
  }, duration);
}

/* ---------- Modal ---------- */

function openModal(modalId) {
  const modal = document.getElementById(modalId);

  if (!modal) {
    console.warn(`Modal not found: ${modalId}`);
    return;
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const focusable = modal.querySelector(
    "button, input, textarea, select, a[href]"
  );

  if (focusable) focusable.focus();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);

  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  });

  document.body.style.overflow = "";
}

/* ---------- Project Data ---------- */

const SolverProjects = {
  key: "solverProjects",

  getAll() {
    const projects = SolverStorage.get(this.key, []);
    return Array.isArray(projects) ? projects : [];
  },

  saveAll(projects) {
    if (!Array.isArray(projects)) return false;
    return SolverStorage.set(this.key, projects);
  },

  getById(id) {
    return this.getAll().find(
      (project) => String(project.id) === String(id)
    ) || null;
  },

  add(project) {
    if (!project || typeof project !== "object") {
      showToast("اطلاعات پروژه معتبر نیست.", "error");
      return false;
    }

    const projects = this.getAll();

    const newProject = {
      id: project.id || (
        window.crypto && typeof window.crypto.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      ),
      title: String(project.title || "").trim(),
      description: String(project.description || "").trim(),
      category: String(project.category || "other"),
      budget: Number(project.budget) || 0,
      deadline: project.deadline || "",
      status: project.status || "open",
      createdAt: project.createdAt || new Date().toISOString(),
      offers: Array.isArray(project.offers) ? project.offers : []
    };

    if (!newProject.title || !newProject.description) {
      showToast("عنوان و توضیحات پروژه الزامی است.", "error");
      return false;
    }

    projects.unshift(newProject);

    if (!this.saveAll(projects)) return false;

    showToast("پروژه با موفقیت ثبت شد.", "success");
    return newProject;
  },

  update(id, updates) {
    const projects = this.getAll();
    const index = projects.findIndex(
      (project) => String(project.id) === String(id)
    );

    if (index === -1) {
      showToast("پروژه پیدا نشد.", "error");
      return false;
    }

    projects[index] = {
      ...projects[index],
      ...updates,
      id: projects[index].id
    };

    return this.saveAll(projects);
  },

  remove(id) {
    const projects = this.getAll();
    const filtered = projects.filter(
      (project) => String(project.id) !== String(id)
    );

    if (filtered.length === projects.length) return false;

    return this.saveAll(filtered);
  }
};

/* ---------- Offer Data ---------- */

const SolverOffers = {
  key: "solverOffers",

  getAll() {
    const offers = SolverStorage.get(this.key, []);
    return Array.isArray(offers) ? offers : [];
  },

  add(offer) {
    if (!offer || typeof offer !== "object") return false;

    const offers = this.getAll();

    const newOffer = {
      id: offer.id || `offer-${Date.now()}`,
      projectId: offer.projectId,
      message: String(offer.message || "").trim(),
      price: Number(offer.price) || 0,
      deliveryTime: String(offer.deliveryTime || "").trim(),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    if (
      !newOffer.projectId ||
      !newOffer.message ||
      newOffer.price <= 0
    ) {
      showToast("اطلاعات پیشنهاد کامل نیست.", "error");
      return false;
    }

    offers.unshift(newOffer);

    if (!SolverStorage.set(this.key, offers)) return false;

    const project = SolverProjects.getById(newOffer.projectId);

    if (project) {
      const projectOffers = Array.isArray(project.offers)
        ? [...project.offers]
        : [];

      projectOffers.push(newOffer);
      SolverProjects.update(project.id, { offers: projectOffers });
    }

    showToast("پیشنهاد شما ثبت شد.", "success");
    return newOffer;
  }
};

/* ---------- Search & Filter ---------- */

function filterProjects(projects, options = {}) {
  if (!Array.isArray(projects)) return [];

  const query = String(options.query || "").trim().toLowerCase();
  const category = options.category || "all";
  const minBudget = Number(options.minBudget) || 0;
  const maxBudget = options.maxBudget === "" ||
    options.maxBudget === undefined ||
    options.maxBudget === null
    ? Infinity
    : Number(options.maxBudget);

  return projects.filter((project) => {
    const title = String(project.title || "").toLowerCase();
    const description = String(project.description || "").toLowerCase();
    const matchesQuery =
      !query ||
      title.includes(query) ||
      description.includes(query);

    const matchesCategory =
      category === "all" || project.category === category;

    const budget = Number(project.budget) || 0;
    const matchesBudget =
      budget >= minBudget && budget <= maxBudget;

    return matchesQuery && matchesCategory && matchesBudget;
  });
}

/* ---------- Mobile Navigation ---------- */

function initMobileMenu() {
  const toggle = document.querySelector(
    ".menu-toggle, [data-menu-toggle]"
  );

  const nav = document.querySelector(
    ".main-nav, .nav-links, [data-main-nav]"
  );

  if (!toggle || !nav) return;

  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", () => {
    const isOpen =
      nav.classList.contains("open") ||
      nav.classList.contains("active");

    nav.classList.toggle("open", !isOpen);
    nav.classList.toggle("active", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open", "active");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      nav.classList.remove("open", "active");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* ---------- Scroll to Top ---------- */

function initScrollToTop() {
  const button = document.querySelector(
    ".scroll-top, #scrollTop"
  );

  if (!button) return;

  const updateButton = () => {
    button.classList.toggle("visible", window.scrollY > 300);
    button.classList.toggle("show", window.scrollY > 300);
  };

  window.addEventListener("scroll", updateButton, { passive: true });
  updateButton();

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/* ---------- Footer Year ---------- */

function initCurrentYear() {
  document.querySelectorAll(
    "#currentYear, #year, [data-current-year]"
  ).forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

/* ---------- Modal Events ---------- */

function initModalEvents() {
  document.addEventListener("click", (event) => {
    const openTrigger = event.target.closest("[data-modal-open]");
    const closeTrigger = event.target.closest("[data-modal-close]");

    if (openTrigger) {
      openModal(openTrigger.dataset.modalOpen);
    }

    if (closeTrigger) {
      const modal = closeTrigger.closest(".modal-overlay");

      if (modal) {
        closeModal(modal.id);
      }
    }

    if (
      event.target.classList.contains("modal-overlay") &&
      !event.target.classList.contains("hidden")
    ) {
      closeModal(event.target.id);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });
}

/* ---------- Initialize ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initScrollToTop();
  initCurrentYear();
  initModalEvents();

  console.log("Solver shared JavaScript initialized.");
});