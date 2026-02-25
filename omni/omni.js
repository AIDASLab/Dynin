// Minimal JS: mobile menu toggle + close on outside click / link click
// + image modal (click [data-modal-src] -> open centered preview)
(() => {
  // ----------------------------
  // 1) Mobile menu (your original)
  // ----------------------------
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  const setOpen = (open) => {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      setOpen(!menu.classList.contains("is-open"));
    });

    menu.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (menu.contains(t) || toggle.contains(t)) return;
      setOpen(false);
    });
  }

  // ----------------------------
  // 2) Image modal
  // ----------------------------
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("imgModalImg");
  const body = document.body;

  const isModalOpen = () => modal && modal.classList.contains("is-open");

  const openModal = (src, alt = "") => {
    if (!modal || !modalImg || !src) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modalImg.src = src;
    modalImg.alt = alt;
    body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal || !modalImg) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    modalImg.alt = "";
    body.style.overflow = "";
  };

  // Click handler (delegated)
  document.addEventListener("click", (e) => {
    const target = e.target;

    // A) Open modal if clicking an element with data-modal-src
    const opener = target.closest?.("[data-modal-src]");
    if (opener) {
      // prevent flip-card click handlers from also firing (important!)
      e.preventDefault();
      e.stopPropagation();

      const src = opener.getAttribute("data-modal-src");
      const img = opener.querySelector("img");
      openModal(src, img?.alt || "Image preview");
      return;
    }

    // B) Close modal if clicking backdrop/close button
    if (target.closest?.("[data-close-modal]")) {
      e.preventDefault();
      closeModal();
      return;
    }

    // Optional: click outside the dialog closes (if your backdrop isn't used)
    // if (modal && isModalOpen() && target === modal) closeModal();
  });

  // ESC closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isModalOpen()) {
      closeModal();
    }
  });

  // Optional: close modal on resize (prevents weird layout on mobile rotate)
  // window.addEventListener("resize", () => { if (isModalOpen()) closeModal(); });
})();