// Minimal JS: mobile menu toggle + close on outside click / link click
// + image modal (click [data-modal-src] -> open centered preview)
// + Examples modality tabs (6) with hash support
(() => {
  // ============================
  // 1) Mobile menu
  // ============================
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

  // ============================
  // 2) Image modal
  // ============================
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("imgModalImg");
  const body = document.body;

  const isModalOpen = () => !!(modal && modal.classList.contains("is-open"));

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

  // Delegated click handler (modal open/close)
  document.addEventListener("click", (e) => {
    const target = e.target;

    // A) Open modal if clicking an element with data-modal-src
    const opener = target.closest?.("[data-modal-src]");
    if (opener) {
      // prevent flip-card or other click handlers from also firing
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
  });

  // ESC closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isModalOpen()) closeModal();
  });

  // ============================
  // 3) Examples modality tabs
  // ============================
  const examplesRoot = document.getElementById("examples");
  if (!examplesRoot) return;

  const nav = examplesRoot.querySelector(".examples-nav");
  const buttons = Array.from(examplesRoot.querySelectorAll(".examples-nav__btn"));
  const panels = Array.from(examplesRoot.querySelectorAll("[data-panel]"));

  const hasPanel = (id) => panels.some((p) => p.id === id);

  const setExamplesActive = (id, { updateHash = true, scrollNav = true } = {}) => {
    if (!id || !hasPanel(id)) return;

    buttons.forEach((b) => b.classList.toggle("is-active", b.dataset.target === id));
    panels.forEach((p) => p.classList.toggle("is-active", p.id === id));

    // Keep active pill visible in horizontal scroll
    const activeBtn = buttons.find((b) => b.dataset.target === id);
    activeBtn?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });

    // Update URL hash without jumping
    if (updateHash) {
      const url = new URL(window.location.href);
      url.hash = id;
      window.history.replaceState(null, "", url.toString());
    }

    // Ensure user sees the nav + panel (nice UX)
    if (scrollNav && nav) {
      const rect = nav.getBoundingClientRect();
      const inView = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      if (!inView) nav.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Clicks on pills
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setExamplesActive(btn.dataset.target, { updateHash: true, scrollNav: true });
    });
  });

  // Initialize from hash if it matches a panel
  const initialId = window.location.hash ? window.location.hash.slice(1) : "";
  if (hasPanel(initialId)) {
    setExamplesActive(initialId, { updateHash: false, scrollNav: false });
  } else {
    // Default: first button/panel
    const first = buttons[0]?.dataset?.target;
    if (first) setExamplesActive(first, { updateHash: false, scrollNav: false });
  }

  // Respond to back/forward hash changes
  window.addEventListener("hashchange", () => {
    const id = window.location.hash ? window.location.hash.slice(1) : "";
    if (hasPanel(id)) setExamplesActive(id, { updateHash: false, scrollNav: false });
  });
})();