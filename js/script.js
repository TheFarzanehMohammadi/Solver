
"use strict";

const scrollTopButton = document.getElementById("scrollTop");
const toast = document.getElementById("toast");
const searchForm = document.getElementById("serviceSearch");
const searchInput = document.getElementById("searchInput");

let toastTimer;

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

if (scrollTopButton) {
    scrollTopButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const query = searchInput.value.trim();

        if (!query) {
            showToast("اول نام خدمت موردنظرت رو وارد کن.");
            searchInput.focus();
            return;
        }

        const destination = new URL("services.html", window.location.href);
        destination.searchParams.set("q", query);

        window.location.href = destination.href;
    });
}
