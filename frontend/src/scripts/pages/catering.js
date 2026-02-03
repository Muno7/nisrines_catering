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

const buildMenuCard = (menu, index) => {
  const src = (menu?.image || "").toString().trim();
  if (!src) return "";
  const label = `Menu ${index + 1}`;
  return `
    <button type="button" class="menu-card js-menu-card" data-src="${src}" data-label="${label}" aria-label="Zoom ${label}">
      <img class="menu-card__image" src="${src}" alt="${label}">
      <span class="menu-card__label">${label}</span>
      <span class="menu-card__hint">Tap to zoom</span>
    </button>
  `;
};

const renderMenus = (menus) => {
  if (!menusContainer) return;
  if (!menus.length) {
    menusContainer.innerHTML = `<div class="catering-empty">Menus will be posted here soon.</div>`;
    return;
  }
  menusContainer.innerHTML = menus.map(buildMenuCard).filter(Boolean).join("");
};

const setupLightbox = () => {
  const lightbox = document.querySelector(".js-catering-lightbox");
  if (!lightbox || !menusContainer) return;

  const image = lightbox.querySelector(".catering-lightbox__image");
  const closeBtn = lightbox.querySelector("[data-lightbox-close]");
  if (!image) return;

  const open = (src, alt) => {
    image.src = src;
    image.alt = alt;
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
      const src = card.getAttribute("data-src") || "";
      const label = card.getAttribute("data-label") || "Catering menu";
      if (!src) return;
      open(src, label);
    });
  });

  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      close();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
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
