import { renderLayout } from "../components/layout.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { API_BASE_URL } from "../../config.js";

renderLayout("catering");
setSiderbarNavigation();

const HERO_TIMEOUT_MS = 2500;
const markHeroReady = (() => {
  let isReady = false;
  return () => {
    if (isReady) return;
    isReady = true;
    document.body.classList.add("hero-ready");
  };
})();

const preloadCateringHero = () => {
  const hero = document.querySelector(".catering-hero__media") || document.querySelector(".catering-hero");
  if (!hero) {
    markHeroReady();
    return;
  }

  const backgroundImage = window.getComputedStyle(hero).backgroundImage || "";
  const match = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
  if (!match || !match[1]) {
    markHeroReady();
    return;
  }

  let isComplete = false;
  const finalize = () => {
    if (isComplete) return;
    isComplete = true;
    window.clearTimeout(timeoutId);
    markHeroReady();
  };

  const timeoutId = window.setTimeout(finalize, HERO_TIMEOUT_MS);
  const img = new Image();
  img.onload = finalize;
  img.onerror = finalize;
  img.src = match[1];
  if (img.complete) finalize();
};

preloadCateringHero();

const menusContainer = document.querySelector(".js-catering-menus");
const menusState = {
  list: [],
  index: 0,
};

const buildMenuCard = (menu, index) => {
  const src = (menu?.image || "").toString().trim();
  if (!src) return "";
  const label = `Menu ${index + 1}`;
  return `
    <button type="button" class="menu-card js-menu-card" data-src="${src}" data-index="${index}" aria-label="Zoom ${label}">
      <img class="menu-card__image" src="${src}" alt="${label}">
      <span class="menu-card__hint">Tap to zoom</span>
    </button>
  `;
};

const renderMenus = (menus) => {
  if (!menusContainer) return;
  const filtered = (menus || []).filter((menu) => {
    const src = (menu?.image || "").toString().trim();
    return Boolean(src);
  });
  menusState.list = filtered;
  menusState.index = 0;
  if (!filtered.length) {
    menusContainer.innerHTML = `<div class="catering-empty">Menus will be posted here soon.</div>`;
    return;
  }
  menusContainer.innerHTML = filtered.map(buildMenuCard).filter(Boolean).join("");
};

const setupLightbox = () => {
  const lightbox = document.querySelector(".js-catering-lightbox");
  if (!lightbox || !menusContainer) return;

  const image = lightbox.querySelector(".catering-lightbox__image");
  const closeBtn = lightbox.querySelector("[data-lightbox-close]");
  const prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  const nextBtn = lightbox.querySelector("[data-lightbox-next]");
  const dialog = lightbox.querySelector(".catering-lightbox__dialog");
  if (!image) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;

  const updateNavState = () => {
    const total = menusState.list.length;
    const atStart = menusState.index <= 0;
    const atEnd = menusState.index >= total - 1;

    if (prevBtn) {
      prevBtn.disabled = total <= 1 || atStart;
      prevBtn.classList.toggle("is-hidden", total <= 1);
    }
    if (nextBtn) {
      nextBtn.disabled = total <= 1 || atEnd;
      nextBtn.classList.toggle("is-hidden", total <= 1);
    }
  };

  const showAt = (index) => {
    if (!menusState.list.length) return;
    const clamped = Math.max(0, Math.min(index, menusState.list.length - 1));
    menusState.index = clamped;
    const menu = menusState.list[clamped];
    const src = (menu?.image || "").toString().trim();
    image.src = src;
    image.alt = `Menu ${clamped + 1}`;
    updateNavState();
  };

  const openAt = (index) => {
    showAt(index);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  menusContainer.querySelectorAll(".js-menu-card").forEach((card) => {
    card.addEventListener("click", () => {
      const rawIndex = Number(card.getAttribute("data-index"));
      if (Number.isNaN(rawIndex)) return;
      openAt(rawIndex);
    });
  });

  prevBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    showAt(menusState.index - 1);
  });

  nextBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    showAt(menusState.index + 1);
  });

  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      close();
    }
  });

  dialog?.addEventListener("touchstart", (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    isTouching = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  dialog?.addEventListener("touchend", (event) => {
    if (!isTouching) return;
    isTouching = false;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) {
      showAt(menusState.index + 1);
    } else {
      showAt(menusState.index - 1);
    }
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") showAt(menusState.index - 1);
    if (event.key === "ArrowRight") showAt(menusState.index + 1);
  });
};

const loadCateringMenus = async () => {
  if (!menusContainer) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/catering-menus`);
    if (!response.ok) {
      throw new Error(`Failed to load catering menus: ${response.status}`);
    }
    const data = await response.json();
    const menus = Array.isArray(data) ? data : [];
    renderMenus(menus);
  } catch (error) {
    console.warn("Catering menus unavailable, using placeholders.", error);
    renderMenus([]);
  }

  setupLightbox();
};

loadCateringMenus();
