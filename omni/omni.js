// Minimal JS: mobile menu toggle + close on outside click / link click
// + image modal (click [data-modal-src] -> open centered preview)
// + Examples modality tabs (6) with hash support
(() => {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  const root = document.documentElement;
  const runContentMdmReveal = () => {
    const TIME_SCALE = 1.5;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced && reduced.matches) {
      root.classList.remove("mdm-pending");
      return;
    }

    const main = document.querySelector("main");
    if (!main) {
      root.classList.remove("mdm-pending");
      return;
    }

    const textTargets = Array.from(
      main.querySelectorAll(
        [
          ".hero__title",
          ".hero__subtitle",
          ".section__title",
          ".prose p",
          ".collection-title h3",
          "#ex-asr-tts .asrtts__label"
        ].join(",")
      )
    );

    const mediaTargets = Array.from(
      main.querySelectorAll(
        [
          ".figure__img",
          ".collection-surface img",
          ".collection-surface video",
          "#ex-image-generation .ig-card",
          "#ex-asr-tts .asrtts__panel"
        ].join(",")
      )
    );

    const toWords = (root) => {
      if (!root || root.dataset.mdmWords === "1") {
        return Array.from(root?.querySelectorAll?.(".mdm-word") || []);
      }
      root.dataset.mdmWords = "1";

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parentTag = node.parentElement?.tagName;
          if (parentTag === "SCRIPT" || parentTag === "STYLE") return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach((node) => {
        const tokens = node.nodeValue.match(/\s+|[^\s]+/g) || [];
        const frag = document.createDocumentFragment();
        tokens.forEach((token) => {
          if (/^\s+$/.test(token)) {
            frag.appendChild(document.createTextNode(token));
            return;
          }
          const span = document.createElement("span");
          span.className = "mdm-word";
          span.textContent = token;
          frag.appendChild(span);
        });
        node.parentNode?.replaceChild(frag, node);
      });

      return Array.from(root.querySelectorAll(".mdm-word"));
    };

    const words = [];
    textTargets.forEach((el, groupIdx) => {
      const groupWords = toWords(el);
      groupWords.forEach((w, i) => {
        const delay = (60 + Math.min(700, groupIdx * 18) + i * 9 + Math.floor(Math.random() * 180)) * TIME_SCALE;
        const dur = (320 + Math.floor(Math.random() * 220)) * TIME_SCALE;
        w.style.setProperty("--mdm-delay", `${Math.round(delay)}ms`);
        w.style.setProperty("--mdm-dur", `${Math.round(dur)}ms`);
        words.push(w);
      });
    });

    mediaTargets.forEach((el, idx) => {
      const delay = (120 + idx * 45 + Math.floor(Math.random() * 260)) * TIME_SCALE;
      const dur = (420 + Math.floor(Math.random() * 260)) * TIME_SCALE;
      el.classList.add("mdm-media");
      el.style.setProperty("--mdm-delay", `${Math.round(delay)}ms`);
      el.style.setProperty("--mdm-dur", `${Math.round(dur)}ms`);
    });

    root.classList.remove("mdm-pending");
    requestAnimationFrame(() => {
      words.forEach((w) => w.classList.add("is-in"));
      mediaTargets.forEach((el) => el.classList.add("is-in"));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runContentMdmReveal, { once: true });
  } else {
    runContentMdmReveal();
  }

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
  // 3) Examples navigation: dock + scrollspy + anchor scroll
  // ============================
  const examplesRoot = document.getElementById("examples");
  if (!examplesRoot) return;

  const navWrapper = document.getElementById("examplesNavWrapper");
  const navPlaceholder = examplesRoot.querySelector(".gallery-nav-placeholder");
  const dockTrigger =
    document.querySelector("#ex-text-reasoning .collection-title h3") ||
    document.querySelector("#ex-text-reasoning .collection-title");
  const dockEndSection = document.getElementById("results");
  const buttons = Array.from(examplesRoot.querySelectorAll('.examples-nav .nav-button[data-nav]'));
  const sections = buttons
    .map((btn) => document.getElementById(btn.dataset.nav))
    .filter(Boolean);

  if (!navWrapper || !dockTrigger || sections.length === 0) return;

  const hasSection = (id) => sections.some((sec) => sec.id === id);

  const setActive = (id, { updateHash = false, scrollPill = false } = {}) => {
    if (!id || !hasSection(id)) return;

    buttons.forEach((btn) => {
      const active = btn.dataset.nav === id;
      btn.classList.toggle("nav-button-active", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
    });

    if (scrollPill) {
      const activeBtn = buttons.find((btn) => btn.dataset.nav === id);
      activeBtn?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
    }

    if (updateHash) {
      const url = new URL(window.location.href);
      url.hash = id;
      window.history.replaceState(null, "", url.toString());
    }
  };

  let lockedActiveId = null;
  let lockUntilMs = 0;

  const updateDockedState = () => {
    const triggerPassedTop = dockTrigger.getBoundingClientRect().top <= 0;
    const beforeDockEnd =
      !dockEndSection || dockEndSection.getBoundingClientRect().top > (navWrapper.offsetHeight + 6);
    const shouldDock = triggerPassedTop && beforeDockEnd;
    const wasDocked = navWrapper.classList.contains("is-docked");

    navWrapper.classList.toggle("is-docked", shouldDock);
    navWrapper.classList.toggle("gallery-nav-sticky", shouldDock);
    if (navPlaceholder) {
      navPlaceholder.style.height = shouldDock ? `${navWrapper.offsetHeight}px` : "0px";
    }

    if (!wasDocked && shouldDock) {
      navWrapper.classList.remove("is-dock-enter");
      // force reflow so repeated docks retrigger animation
      void navWrapper.offsetWidth;
      navWrapper.classList.add("is-dock-enter");
      window.setTimeout(() => navWrapper.classList.remove("is-dock-enter"), 260);
    }
  };

  const getScrollTargetTop = (sec) => {
    const navH = navWrapper.offsetHeight || 0;
    const gap = navWrapper.classList.contains("is-docked") ? 20 : 28;
    return Math.max(0, Math.round(window.scrollY + sec.getBoundingClientRect().top - navH - gap));
  };

  const scrollToSection = (id) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    window.scrollTo({ top: getScrollTargetTop(sec), behavior: "smooth" });
  };

  const updateActiveFromScroll = () => {
    if (lockedActiveId && Date.now() < lockUntilMs) {
      setActive(lockedActiveId);
      return;
    }
    lockedActiveId = null;
    lockUntilMs = 0;

    const navH = navWrapper.offsetHeight || 0;
    const probeY = navWrapper.classList.contains("is-docked") ? navH + 18 : 18;
    let currentId = sections[0].id;

    for (const sec of sections) {
      if (sec.getBoundingClientRect().top <= probeY) currentId = sec.id;
    }
    setActive(currentId);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.nav;
      if (!hasSection(id)) return;
      lockedActiveId = id;
      lockUntilMs = Date.now() + 900;
      setActive(id, { updateHash: true, scrollPill: true });
      scrollToSection(id);
    });
  });

  let ticking = false;
  const onScrollOrResize = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateDockedState();
      updateActiveFromScroll();
      ticking = false;
    });
  };

  const navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  const isBackForward = !!(navEntry && navEntry.type === "back_forward");
  const initialId = window.location.hash ? window.location.hash.slice(1) : "";
  updateDockedState();
  setActive(hasSection(initialId) ? initialId : sections[0].id, { scrollPill: true });
  if (!isBackForward) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  } else if (hasSection(initialId)) {
    scrollToSection(initialId);
  }
  updateActiveFromScroll();

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  window.addEventListener("load", onScrollOrResize);
  window.addEventListener("hashchange", () => {
    const id = window.location.hash ? window.location.hash.slice(1) : "";
    if (!hasSection(id)) return;
    setActive(id, { scrollPill: true });
    scrollToSection(id);
  });
})();
