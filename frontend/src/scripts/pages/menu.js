import { products, loadProducts } from "../models/products.js";
import { productCardHTML } from "../handlers/productHandler.js";
import { updateCartQuantity } from '../handlers/cartHandler.js';
import { addToFavoriteEventListeners } from "../handlers/favoriteHandler.js";
import { appendOverlayDiv, renderProductOverlay } from "../utils/overlay.js";
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

  const setActiveLink = (category) => {
    menuLinks.forEach((link) => {
      const isActive = link.dataset.category === category;
      link.classList.toggle('active', isActive);
    });
  };

  menuLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const { category } = event.currentTarget.dataset;
      activeCategory = category;
      setActiveLink(category);
      renderProductsGrid(category);

      event.currentTarget.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  });

  setupCategoryScrollIndicators();
  setActiveLink(activeCategory);
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
      <nav class="filter-bar-js flex flex-col top-0 w-full pl-4 sm:pl-8 lg:pl-10 pb-4 pt-[82px] h-full">
        <!-- Filter content will go here -->
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
          <div class="products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center"></div>
        </div>
      </div>
    </section>`;

  setupSearchInput();
  setupFilterPanel();
  renderProductsGrid(activeCategory);
}

function setupSearchInput() {
  const searchInput = document.querySelector(".js-menu-search");
  if (!searchInput) return;
  searchInput.value = searchTerm;
  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderProductsGrid(activeCategory);
  });
}

function matchesSearch(product) {
  const trimmed = searchTerm.trim();
  if (!trimmed) return true;
  const query = trimmed.toLocaleLowerCase();
  const fields = [product.name, product.nameAr, product.ingredients];
  return fields.some((field) => typeof field === "string" && field.toLocaleLowerCase().includes(query));
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

function renderProductsGrid(categoryFilter = DEFAULT_CATEGORY) {
  const gridContainer = document.querySelector('.products-grid');
  if (!gridContainer) return;

  const visibleProducts = (categoryFilter === DEFAULT_CATEGORY
    ? products
    : products.filter(product => product.category === categoryFilter)
  ).filter(matchesSearch);

  if (!visibleProducts.length) {
    gridContainer.innerHTML = '<div class="col-span-full w-full py-12 text-center text-gray-500 text-lg">No products found in this category.</div>';
    updateProductCount(0);
    return;
  }

  gridContainer.innerHTML = visibleProducts
    .map(product => productCardHTML(product))
    .join('');

  const addToFavoriteButtonElement = document.querySelectorAll(".js-add-to-favorite-button");
  addToFavoriteEventListeners(addToFavoriteButtonElement);

  updateProductCount(visibleProducts.length);

  updateCartQuantity();
}


loadMenuPage();
