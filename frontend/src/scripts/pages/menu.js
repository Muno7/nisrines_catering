import { products, loadProducts } from "../models/products.js";
import { productCardHTML } from "../handlers/productHandler.js";
import { updateCartQuantity } from '../handlers/cartHandler.js';
import { addToFavoriteEventListeners } from "../handlers/favoriteHandler.js";
import { favorite } from "../models/favorites.js";
import { appendOverlayDiv, renderProductOverlay } from "../utils/overlay.js";
import { isProductAvailable } from "../utils/day.js";
import { bindSlidingPanel, setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { renderLayout } from "../components/layout.js";
import { API_BASE_URL } from "../../config.js";

let menuCategories = [];
const DEFAULT_CATEGORY = "all";
let activeCategory = DEFAULT_CATEGORY;
let searchTerm = "";

const getSortedMenuCategories = () =>
  menuCategories.slice().sort((a, b) => a.sort_order - b.sort_order);

const getFilterCategories = () => [
  { slug: DEFAULT_CATEGORY, name: "All", hidden: false },
  ...getSortedMenuCategories(),
];

const DAY_OPTIONS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_ORDER = Object.fromEntries(DAY_OPTIONS.map((day, index) => [day, index]));

const filterState = {
  categories: new Set(),
  portions: new Set(),
  priceMin: "",
  priceMax: "",
  favoritesOnly: false,
  days: new Set(),
};

renderLayout("menu");

async function loadMenuPage() {
  setSiderbarNavigation();
  try {
    await fetchMenuCategories();
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  renderMenuGrid();
  makeMenuLinksActive();
  appendOverlayDiv();
  renderProductOverlay();
}

function scrollToMenuTop() {
  const mainSection = document.querySelector(".menu-sections");
  if (!mainSection) return;
  const header = document.querySelector("header");
  const headerHeight = header ? header.offsetHeight : 0;
  const targetTop = mainSection.getBoundingClientRect().top + window.scrollY - headerHeight;
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth",
  });
}

async function fetchMenuCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length) {
      menuCategories = data;
      return;
    }
    console.warn("Categories response empty");
    menuCategories = [];
  } catch (error) {
    console.warn("Error fetching categories", error);
    menuCategories = [];
  }
}

function makeMenuLinksActive() {
  const menuList = document.querySelector(".menu-categories");
  if (menuList) {
    menuList.innerHTML = getFilterCategories()
      .map(
        ({ slug, name, hidden }) =>
          `<li class="menu-links${hidden ? " hidden" : ""}"><a href="#" role="button" data-category="${slug}">${name}</a></li>`
      )
      .join("");
  }

  const menuLinks = document.querySelectorAll('.menu-links a');
  setActiveCategoryLink(activeCategory);

  menuLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const { category } = event.currentTarget.dataset;
      activeCategory = category;
      filterState.categories = category === DEFAULT_CATEGORY ? new Set() : new Set([category]);
      setActiveCategoryLink(category);
      syncFilterControls();
      renderProductsGrid();
      updateAppliedFiltersChips();

      scrollToMenuTop();
      event.currentTarget.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  });

  setupCategoryScrollIndicators();
  setActiveCategoryLink(activeCategory);
}

function setupCategoryScrollIndicators() {
  const categoriesList = document.querySelector('.menu-categories');
  const leftButton = document.querySelector('.menu-scroll-left');
  const rightButton = document.querySelector('.menu-scroll-right');

  if (!categoriesList || !leftButton || !rightButton) return;
  if (categoriesList.dataset.scrollIndicatorsReady === 'true') return;
  categoriesList.dataset.scrollIndicatorsReady = 'true';

  const updateButtons = () => {
    const { scrollLeft, scrollWidth, clientWidth } = categoriesList;
    const edgeAllowance = 6;
    const canScroll = scrollWidth - clientWidth > 8;

    leftButton.classList.toggle('visible', canScroll && scrollLeft > edgeAllowance);
    rightButton.classList.toggle(
      'visible',
      canScroll && scrollLeft < scrollWidth - clientWidth - edgeAllowance
    );
  };

  const scrollDistance = () => Math.max(categoriesList.clientWidth * 0.5, 140);

  leftButton.addEventListener('click', () => {
    categoriesList.scrollBy({ left: -scrollDistance(), behavior: 'smooth' });
  });

  rightButton.addEventListener('click', () => {
    categoriesList.scrollBy({ left: scrollDistance(), behavior: 'smooth' });
  });

  categoriesList.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateButtons);
  });

  window.addEventListener('resize', updateButtons);

  updateButtons();
}

function renderMenuGrid() {
  const sectionsContainer = document.querySelector(".menu-sections");
  if (!sectionsContainer) return;

  if (!products.length) {
    sectionsContainer.innerHTML = '<div class="w-full py-12 text-center text-gray-500 text-lg">No products available right now. Please check back soon.</div>';
    const menuList = document.querySelector(".menu-categories");
    if (menuList) menuList.innerHTML = "";
    return;
  }

  sectionsContainer.innerHTML = `
    <div class="filter-navigation fixed bg-surface top-0 w-[75%] sm:w-[50%] lg:w-[33%] h-[100vh] shadow-lg transition-all duration-500 z-30 left-[-75%] md:left-[-50%] lg:left-[-33%]">
      <nav class="filter-bar-js flex flex-col top-0 w-full pl-4 sm:pl-8 lg:pl-10 py-4 h-full">
        ${getFilterPanelMarkup()}
      </nav>
    </div>
    <section class="lg:px-8 lg:py-4">
      <div class="px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label class="w-full sm:w-auto sm:flex-1">
              <span class="sr-only">Search menu</span>
              <div class="relative">
                <input
                  type="search"
                  class="js-menu-search w-full sm:w-[360px] lg:w-[420px] rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/60"
                  placeholder="Search dishes or ingredients"
                  value="${searchTerm}"
                />
                <svg class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 7.5 16.5a7.5 7.5 0 0 0 9.15 0Z" />
                </svg>
              </div>
            </label>
            <div class="flex items-center gap-3">
              <button class="js-filter-toggle h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M6 12h12M10 18h4"/>
                </svg>
              </button>
              <div class="js-products-count text-sm text-gray-600 text-right">${products.length} items</div>
            </div>
          </div>
          <div class="js-active-filters hidden flex flex-wrap gap-2 items-center px-1 text-sm"></div>
          <div class="products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center"></div>
        </div>
      </div>
    </section>`;

  setupSearchInput();
  setupFilterPanel();
  setupFilterControls();
  setupActiveFilterChips();
  renderProductsGrid();
}

function setupSearchInput() {
  const searchInput = document.querySelector(".js-menu-search");
  if (!searchInput) return;
  searchInput.value = searchTerm;
  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderProductsGrid();
  });
}

function matchesSearch(product) {
  const trimmed = searchTerm.trim();
  if (!trimmed) return true;
  const query = trimmed.toLocaleLowerCase();
  const fields = [product.name, product.nameAr, product.ingredients];
  return fields.some((field) => typeof field === "string" && field.toLocaleLowerCase().includes(query));
}

function getDisplayPortionPreference() {
  if (filterState.portions.size === 1) {
    if (filterState.portions.has("family")) return "family";
    if (filterState.portions.has("single")) return "single";
  }
  return "single";
}

function updateProductCount(count) {
  const countElement = document.querySelector(".js-products-count");
  if (!countElement) return;
  countElement.textContent = `${count} item${count === 1 ? "" : "s"}`;
}

function setupFilterPanel() {
  bindSlidingPanel({
    buttonSelector: ".js-filter-toggle",
    panelSelector: ".filter-navigation"
  });
}

function renderProductsGrid() {
  const gridContainer = document.querySelector('.products-grid');
  if (!gridContainer) return;

  const visibleProducts = getFilteredProducts();

  if (!visibleProducts.length) {
    gridContainer.innerHTML = '<div class="col-span-full w-full py-12 text-center text-gray-500 text-lg">No dishes match these filters yet.</div>';
    updateProductCount(0);
    return;
  }

  const displayPortion = getDisplayPortionPreference();
  gridContainer.innerHTML = visibleProducts
    .map(product => {
      const portion = displayPortion === 'family' && typeof product.family === 'number' ? 'family' : 'single';
      return productCardHTML(product, portion);
    })
    .join('');

  const addToFavoriteButtonElement = document.querySelectorAll(".js-add-to-favorite-button");
  addToFavoriteEventListeners(addToFavoriteButtonElement);
  addToFavoriteButtonElement.forEach((button) => {
    const input = button.querySelector('input');
    if (input) {
      input.addEventListener('change', () => {
        if (filterState.favoritesOnly) {
          renderProductsGrid();
          updateAppliedFiltersChips();
        }
      });
    }
  });

  updateProductCount(visibleProducts.length);

  updateCartQuantity();
}

function setActiveCategoryLink(category) {
  const menuLinks = document.querySelectorAll('.menu-links a');
  menuLinks.forEach((link) => {
    const isActive = link.dataset.category === category;
    link.classList.toggle('active', isActive);
  });
}

function getCategoryNameBySlug(slug) {
  if (slug === DEFAULT_CATEGORY) return "All";
  const match = menuCategories.find(({ slug: catSlug }) => catSlug === slug);
  return match ? match.name : slug;
}

function getFilterPanelMarkup() {
  const categoryOptions = getFilterCategories()
    .map(({ slug, name, hidden }) => `
      <label class="filter-option ${hidden ? "hidden" : ""}">
        <input type="checkbox" value="${slug}" class="js-filter-category" />
        <span>${name}</span>
      </label>
    `)
    .join("");

  const dayOptions = DAY_OPTIONS.map((day) => `
      <label class="filter-option">
        <input type="checkbox" value="${day}" class="js-filter-day" />
        <span>${day.charAt(0).toUpperCase() + day.slice(1)}</span>
      </label>
    `).join("");

  return `
    <div class="flex items-center justify-between pr-6">
      <div class="flex flex-col gap-0.5">
        <p class="text-[10px] uppercase tracking-[0.2em] text-muted/90">Filter & Sort</p>
        <h3 class="text-lg font-semibold text-text">Menu Filters</h3>
      </div>
      <button type="button" class="js-filter-close h-9 w-9 flex items-center justify-center rounded-full border border-muted/30 text-text hover:bg-white shadow-sm transition">
        <span aria-hidden="true" class="text-base">&times;</span>
        <span class="sr-only">Close filters</span>
      </button>
    </div>

    <div class="mt-6 flex-1 overflow-y-auto pr-6 space-y-6 filter-scroll-area">
      <section class="filter-section">
        <h4 class="filter-section-title">Category</h4>
        <div class="space-y-3">
          ${categoryOptions}
        </div>
      </section>

      <section class="filter-section">
        <h4 class="filter-section-title">Portion Size</h4>
        <div class="space-y-3">
          <label class="filter-option">
            <input type="checkbox" value="family" class="js-filter-portion" />
            <span>Family of 4</span>
          </label>
        </div>
      </section>

      <section class="filter-section">
        <h4 class="filter-section-title">Price</h4>
        <div class="grid grid-cols-2 gap-3">
          <label class="filter-input-label">
            <span class="text-xs text-muted/90">Min</span>
            <div class="filter-input">
              <span class="text-muted">$</span>
              <input type="number" min="0" step="0.5" placeholder="0" class="js-filter-min" />
            </div>
          </label>
          <label class="filter-input-label">
            <span class="text-xs text-muted/90">Max</span>
            <div class="filter-input">
              <span class="text-muted">$</span>
              <input type="number" min="0" step="0.5" placeholder="99" class="js-filter-max" />
            </div>
          </label>
        </div>
      </section>

      <section class="filter-section">
        <h4 class="filter-section-title">Favorites</h4>
        <label class="filter-option toggle-option">
          <input type="checkbox" class="js-filter-favorites" />
          <span>Show only favorites</span>
        </label>
      </section>

      <section class="filter-section">
        <h4 class="filter-section-title">Day</h4>
        <div class="grid grid-cols-2 gap-2">
          ${dayOptions}
        </div>
      </section>
    </div>

    <div class="mt-6 pr-6 flex items-center justify-between gap-3 border-t border-muted/20 pt-4">
      <button type="button" class="js-filter-clear flex-1 py-3 text-sm font-semibold text-text underline underline-offset-4 decoration-muted hover:decoration-text transition">Clear</button>
      <button type="button" class="js-filter-apply flex-1 button-cta py-3 text-sm uppercase tracking-wide">Apply</button>
    </div>
  `;
}

function setupFilterControls() {
  const filterBar = document.querySelector('.filter-bar-js');
  if (!filterBar) return;

  filterBar.querySelectorAll('.js-filter-category').forEach((input) => {
    input.addEventListener('change', (event) => {
      const { value, checked } = event.target;
      if (value === DEFAULT_CATEGORY) {
        if (checked) {
          filterState.categories = new Set();
          filterBar.querySelectorAll('.js-filter-category').forEach((checkbox) => {
            if (checkbox.value !== DEFAULT_CATEGORY) checkbox.checked = false;
          });
        }
      } else {
        filterState.categories.delete(DEFAULT_CATEGORY);
        if (checked) {
          filterState.categories.add(value);
        } else {
          filterState.categories.delete(value);
        }
        const allOption = filterBar.querySelector(`.js-filter-category[value="${DEFAULT_CATEGORY}"]`);
        if (allOption) allOption.checked = false;
      }
      activeCategory = filterState.categories.size === 1 ? [...filterState.categories][0] : DEFAULT_CATEGORY;
      setActiveCategoryLink(activeCategory);
      onFilterChange();
    });
  });

  filterBar.querySelectorAll('.js-filter-portion').forEach((input) => {
    input.addEventListener('change', (event) => {
      const { value, checked } = event.target;
      if (checked) {
        filterState.portions.add(value);
      } else {
        filterState.portions.delete(value);
      }
      onFilterChange();
    });
  });

  const minInput = filterBar.querySelector('.js-filter-min');
  const maxInput = filterBar.querySelector('.js-filter-max');
  [minInput, maxInput].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', (event) => {
      const { classList, value } = event.target;
      const sanitized = value === "" ? "" : Math.max(0, Number(value) || 0).toString();
      event.target.value = sanitized;
      if (classList.contains('js-filter-min')) {
        filterState.priceMin = sanitized;
      } else {
        filterState.priceMax = sanitized;
      }
    });
    input.addEventListener('change', onFilterChange);
  });

  const favoritesInput = filterBar.querySelector('.js-filter-favorites');
  if (favoritesInput) {
    favoritesInput.addEventListener('change', (event) => {
      filterState.favoritesOnly = event.target.checked;
      onFilterChange();
    });
  }

  filterBar.querySelectorAll('.js-filter-day').forEach((input) => {
    input.addEventListener('change', (event) => {
      const { value, checked } = event.target;
      if (checked) {
        filterState.days.add(value);
      } else {
        filterState.days.delete(value);
      }
      onFilterChange();
    });
  });

  const clearButton = filterBar.querySelector('.js-filter-clear');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      resetFilters();
      onFilterChange();
    });
  }

  const applyButton = filterBar.querySelector('.js-filter-apply');
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      onFilterChange();
      closeFilterPanel();
    });
  }

  const closeButton = filterBar.querySelector('.js-filter-close');
  if (closeButton) {
    closeButton.addEventListener('click', closeFilterPanel);
  }

  syncFilterControls();
}

function onFilterChange() {
  renderProductsGrid();
  updateAppliedFiltersChips();
  syncFilterControls();
}

function closeFilterPanel() {
  const panel = document.querySelector('.filter-navigation');
  const toggleButton = document.querySelector('.js-filter-toggle');
  if (!panel) return;
  if (panel.classList.contains('left-0') && toggleButton) {
    toggleButton.click();
    return;
  }
  panel.classList.remove('left-0');
  panel.classList.add('left-[-75%]', 'md:left-[-50%]', 'lg:left-[-33%]');
  document.body.classList.remove('no-scroll');
}

function resetFilters() {
  filterState.categories = new Set();
  filterState.portions = new Set();
  filterState.priceMin = "";
  filterState.priceMax = "";
  filterState.favoritesOnly = false;
  filterState.days = new Set();
  activeCategory = DEFAULT_CATEGORY;
  setActiveCategoryLink(activeCategory);
}

function syncFilterControls() {
  const filterBar = document.querySelector('.filter-bar-js');
  if (!filterBar) return;

  filterBar.querySelectorAll('.js-filter-category').forEach((input) => {
    if (input.value === DEFAULT_CATEGORY) {
      input.checked = filterState.categories.size === 0;
    } else {
      input.checked = filterState.categories.has(input.value);
    }
  });

  filterBar.querySelectorAll('.js-filter-portion').forEach((input) => {
    input.checked = filterState.portions.has(input.value);
  });

  const minInput = filterBar.querySelector('.js-filter-min');
  const maxInput = filterBar.querySelector('.js-filter-max');
  if (minInput) minInput.value = filterState.priceMin;
  if (maxInput) maxInput.value = filterState.priceMax;

  const favoritesInput = filterBar.querySelector('.js-filter-favorites');
  if (favoritesInput) favoritesInput.checked = filterState.favoritesOnly;

  filterBar.querySelectorAll('.js-filter-day').forEach((input) => {
    input.checked = filterState.days.has(input.value);
  });
}

function setupActiveFilterChips() {
  const chipContainer = document.querySelector('.js-active-filters');
  if (!chipContainer || chipContainer.dataset.listenerAttached === "true") return;
  chipContainer.dataset.listenerAttached = "true";

  chipContainer.addEventListener('click', (event) => {
    const removeButton = event.target.closest('button[data-chip-type]');
    if (!removeButton) return;
    const { chipType, chipValue } = removeButton.dataset;
    removeFilterChip(chipType, chipValue);
  });

  updateAppliedFiltersChips();
}

function removeFilterChip(type, value) {
  switch (type) {
    case "category":
      filterState.categories.delete(value);
      activeCategory = filterState.categories.size === 1 ? [...filterState.categories][0] : DEFAULT_CATEGORY;
      setActiveCategoryLink(activeCategory);
      break;
    case "portion":
      filterState.portions.delete(value);
      break;
    case "priceMin":
      filterState.priceMin = "";
      break;
    case "priceMax":
      filterState.priceMax = "";
      break;
    case "favorites":
      filterState.favoritesOnly = false;
      break;
    case "day":
      filterState.days.delete(value);
      break;
    case "clear":
      resetFilters();
      break;
    default:
      break;
  }
  onFilterChange();
}

function updateAppliedFiltersChips() {
  const chipContainer = document.querySelector('.js-active-filters');
  if (!chipContainer) return;

  const chips = [];

  filterState.categories.forEach((slug) => {
    chips.push({
      type: "category",
      value: slug,
      label: getCategoryNameBySlug(slug)
    });
  });

  filterState.portions.forEach((portion) => {
    const label = portion === "family" ? "Family of 4" : portion;
    chips.push({ type: "portion", value: portion, label });
  });

  if (filterState.priceMin) {
    chips.push({ type: "priceMin", value: filterState.priceMin, label: `Min $${Number(filterState.priceMin).toFixed(2)}` });
  }

  if (filterState.priceMax) {
    chips.push({ type: "priceMax", value: filterState.priceMax, label: `Max $${Number(filterState.priceMax).toFixed(2)}` });
  }

  if (filterState.favoritesOnly) {
    chips.push({ type: "favorites", value: "favorites", label: "Favorites" });
  }

  filterState.days.forEach((day) => {
    chips.push({ type: "day", value: day, label: day.charAt(0).toUpperCase() + day.slice(1) });
  });

  if (!chips.length) {
    chipContainer.innerHTML = "";
    chipContainer.classList.add('hidden');
    return;
  }

  chipContainer.classList.remove('hidden');
  chipContainer.innerHTML = chips.map(({ type, value, label }) => `
    <span class="filter-chip" data-chip-type="${type}" data-chip-value="${value}">
      <span>${label}</span>
      <button type="button" aria-label="Remove ${label}" data-chip-type="${type}" data-chip-value="${value}">x</button>
    </span>
  `).join("") + `
    <button type="button" class="filter-chip clear-all" data-chip-type="clear" data-chip-value="all">Clear all</button>
  `;
}

function getProductPrices(product) {
  const prices = [];
  if (typeof product.priceCents === "number") prices.push(product.priceCents);
  if (typeof product.single === "number") prices.push(product.single);
  if (typeof product.family === "number") prices.push(product.family);
  return prices;
}

function getPricesForFiltering(product) {
  const prices = [];
  const wantsSingle = !filterState.portions.size || filterState.portions.has("single");
  const wantsFamily = !filterState.portions.size || filterState.portions.has("family");

  if (wantsSingle) {
    if (typeof product.single === "number") {
      prices.push(product.single);
    } else if (typeof product.priceCents === "number") {
      prices.push(product.priceCents);
    }
  }

  if (wantsFamily && typeof product.family === "number") {
    prices.push(product.family);
  }

  return prices.length ? prices : getProductPrices(product);
}

function matchesCategory(product) {
  if (!filterState.categories.size) return true;
  return filterState.categories.has(product.category);
}

function matchesPortion(product) {
  if (!filterState.portions.size) return true;
  const hasSingle = typeof product.single === "number" || typeof product.priceCents === "number";
  const hasFamily = typeof product.family === "number";
  const wantsSingle = filterState.portions.has("single");
  const wantsFamily = filterState.portions.has("family");
  return (wantsSingle && hasSingle) || (wantsFamily && hasFamily);
}

function matchesPrice(product) {
  if (!filterState.priceMin && !filterState.priceMax) return true;
  const prices = getPricesForFiltering(product);
  if (!prices.length) return false;
  let minCents = filterState.priceMin ? Math.round(Number(filterState.priceMin) * 100) : null;
  let maxCents = filterState.priceMax ? Math.round(Number(filterState.priceMax) * 100) : null;
  if (minCents !== null && maxCents !== null && minCents > maxCents) {
    [minCents, maxCents] = [maxCents, minCents];
  }
  return prices.some((price) => {
    const aboveMin = minCents === null || price >= minCents;
    const belowMax = maxCents === null || price <= maxCents;
    return aboveMin && belowMax;
  });
}

function matchesFavorites(product) {
  if (!filterState.favoritesOnly) return true;
  return favorite.favoriteItems.some((item) => String(item.productId) === String(product.id));
}

function matchesDayFilter(product) {
  if (!filterState.days.size) return true;
  if (!product.day) return false;
  return filterState.days.has(String(product.day).toLowerCase());
}

function getFilteredProducts() {
  const sorted = products
    .filter(isProductAvailable)
    .filter(matchesCategory)
    .filter(matchesPortion)
    .filter(matchesPrice)
    .filter(matchesFavorites)
    .filter(matchesDayFilter)
    .filter(matchesSearch)
    .sort((a, b) => {
      const aDay = (a.day || "").toLowerCase();
      const bDay = (b.day || "").toLowerCase();
      const aHasDay = aDay in DAY_ORDER;
      const bHasDay = bDay in DAY_ORDER;

      if (aHasDay && bHasDay && DAY_ORDER[aDay] !== DAY_ORDER[bDay]) {
        return DAY_ORDER[aDay] - DAY_ORDER[bDay];
      }
      if (aHasDay !== bHasDay) {
        return aHasDay ? -1 : 1; // items with a day come first
      }

      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

  return sorted;
}


loadMenuPage();
