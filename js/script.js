
/* =========================
   Solver - Global JavaScript
   ========================= */

document.addEventListener("DOMContentLoaded", function () {
  initMobileMenu();
  initScrollToTop();
  initToastDismiss();
  initModal();
  initCurrentYear();
});

/* Read and write localStorage safely */

function getStoredData(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Solver storage read error:", error);
    return fallback;
  }
}

function setStoredData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Solver storage write error:", error);
    showToast("ذخیره اطلاعات انجام نشد.");
    return false;
  }
}

/* Mobile menu */

function initMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", function () {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!isExpanded));
    menu.classList.toggle("is-open", !isExpanded);
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* Scroll-to-top button */

function initScrollToTop() {
  let button = document.querySelector(".scroll-top");

  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "scroll-top";
    button.textContent = "↑";
    button.setAttribute("aria-label", "بازگشت به بالای صفحه");
    document.body.appendChild(button);
  }

  function updateButton() {
    button.classList.toggle("visible", window.scrollY > 300);
  }

  window.addEventListener("scroll", updateButton, { passive: true });
  updateButton();

  button.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* Toast notification */

function showToast(message, duration = 3000) {
  const oldToast = document.querySelector(".toast-message");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.setAttribute("role", "status");
  toast.textContent = message;

  document.body.appendChild(toast);

  window.setTimeout(function () {
    toast.remove();
  }, duration);
}

function initToastDismiss() {
  document.querySelectorAll("[data-toast]").forEach(function (element) {
    element.addEventListener("click", function () {
      showToast(element.dataset.toast || "انجام شد.");
    });
  });
}

/* Modal */

function initModal() {
  document.querySelectorAll("[data-modal-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      const targetId = button.getAttribute("data-modal-open");
      const modal = document.getElementById(targetId);

      if (modal) {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
      }
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      const modal = button.closest(".modal-backdrop-custom, [data-modal]");

      if (modal) {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
      }
    });
  });

  document.querySelectorAll(".modal-backdrop-custom").forEach(function (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    document.querySelectorAll(
      ".modal-backdrop-custom:not([hidden]), [data-modal]:not([hidden])"
    ).forEach(function (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    });
  });
}

/* Current year in footer */

function initCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });
}

/* Project helpers */

function getSolverProjects() {
  return getStoredData("solverProjects", []);
}

function saveSolverProject(project) {
  const projects = getSolverProjects();

  const newProject = {
    id: project.id || Date.now().toString(),
    title: String(project.title || "").trim(),
    description: String(project.description || "").trim(),
    category: project.category || "other",
    budget: project.budget || "",
    deadline: project.deadline || "",
    createdAt: project.createdAt || new Date().toISOString()
  };

  if (!newProject.title || !newProject.description) {
    showToast("عنوان و توضیحات پروژه الزامی است.");
    return false;
  }

  projects.unshift(newProject);

  if (!setStoredData("solverProjects", projects)) return false;

  showToast("پروژه با موفقیت ثبت شد.");
  return newProject;
}

/* Offer helpers */

function getSolverOffers() {
  return getStoredData("solverOffers", []);
}

function saveSolverOffer(offer) {
  const offers = getSolverOffers();

  const newOffer = {
    id: Date.now().toString(),
    projectId: String(offer.projectId || ""),
    name: String(offer.name || "").trim(),
    price: offer.price || "",
    days: offer.days || "",
    message: String(offer.message || "").trim(),
    createdAt: new Date().toISOString()
  };

  if (!newOffer.projectId || !newOffer.name) {
    showToast("اطلاعات پیشنهاد کامل نیست.");
    return false;
  }

  offers.push(newOffer);

  if (!setStoredData("solverOffers", offers)) return false;

  showToast("پیشنهاد شما ثبت شد.");
  return newOffer;
}

/* Search and filter helper */

function filterProjects(projects, options = {}) {
  const search = String(options.search || "").trim().toLowerCase();
  const category = String(options.category || "").trim();
  const maxBudget = Number(options.maxBudget) || 0;

  return projects.filter(function (project) {
    const title = String(project.title || "").toLowerCase();
    const description = String(project.description || "").toLowerCase();

    const matchesSearch =
      !search ||
      title.includes(search) ||
      description.includes(search);

    const matchesCategory =
      !category ||
      category === "all" ||
      project.category === category;

    const budget = Number(project.budget) || 0;
    const matchesBudget = !maxBudget || (budget > 0 && budget <= maxBudget);

    return matchesSearch && matchesCategory && matchesBudget;
  });
}

/* Export helpers for other scripts when needed */

window.Solver = {
  getStoredData,
  setStoredData,
  showToast,
  getSolverProjects,
  saveSolverProject,
  getSolverOffers,
  saveSolverOffer,
  filterProjects
};