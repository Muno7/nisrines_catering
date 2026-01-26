import { products, loadProducts } from "../models/products.js";
import { productCardHTML } from "../handlers/productHandler.js";
import { updateCartQuantity, addButtonEventListeners, subtractQuantityEventListeners, addQuantityEventListeners } from '../handlers/cartHandler.js';
import { addToFavoriteEventListeners } from "../handlers/favoriteHandler.js";
import { appendOverlayDiv, renderProductOverlay } from "../utils/overlay.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { setCategoryScrollBehavior } from "../utils/animations/scrollBehavior.js";
import { renderLayout } from "../components/layout.js";
import { API_BASE_URL } from "../../config.js";

let menuCategories = [];

const getSortedMenuCategories = () =>
  menuCategories.slice().sort((a, b) => a.sort_order - b.sort_order);

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
  setCategoryScrollBehavior();
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

function buildSection(category) {
  const { slug, name, hidden } = category;
  const title = name;
  const isPlatDuJour = slug === "plat-du-jour";

  return `<section id="${slug}" class="${hidden ? "hidden " : ""}lg:px-8 lg:py-4">
            <div class="relative">
              <div class="flex flex-col font-bold px-4">
                <h1 class="text-4xl ${isPlatDuJour ? "" : "mb-2"}">${title}</h1>
                ${isPlatDuJour ? '<p>Note: (salad/yogurt included)</p>' : ""}
              </div>
              <div id="${slug}-scrollContainer" class="wrapper overflow-x-auto whitespace-nowrap relative overflow-visible">
                <div class="${slug}-container inline-flex space-x-2 p-4">
                </div>
              </div>
              <button id="scrollLeft" data-category="${slug}" aria-label="Scroll left" class="absolute left-[-15px] top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 shadow-lg rounded-full p-3 hidden lg:flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button id="scrollRight" data-category="${slug}" aria-label="Scroll right" class="absolute right-[-15px] top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 shadow-lg rounded-full p-3 hidden lg:flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>`;
}

function makeMenuLinksActive() {
  const menuList = document.querySelector(".menu-categories");
  if (menuList) {
    menuList.innerHTML = getSortedMenuCategories()
      .map(
        ({ slug, name, hidden }) =>
          `<li class="menu-links${hidden ? " hidden" : ""}"><a href="#${slug}">${name}</a></li>`
      )
      .join("");
  }

  const menuLinks = document.querySelectorAll('.menu-links a');
  menuLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      menuLinks.forEach(item => item.classList.remove('active'));
      event.currentTarget.classList.add('active');
    });
  });
  const sections = document.querySelectorAll("section");
  const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`.menu-links a[href="#${id}"]`);
    
          if (entry.isIntersecting) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`.menu-links a[href="#${id}"]`);
        
          if (entry.isIntersecting) {
            link.classList.add("active");
        
            // Scroll the nav to bring the link into view
            link.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          } else {
            link.classList.remove("active");
          }
        });
        
      },
      {
        rootMargin: "-20% 0px -70% 0px",
      }
    );
  sections.forEach((section) => observer.observe(section));
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

  const sortedCategories = getSortedMenuCategories();
  if (!sortedCategories.length) {
    sectionsContainer.innerHTML = '<div class="w-full py-12 text-center text-gray-500 text-lg">No menu categories available right now.</div>';
    return;
  }

  sectionsContainer.innerHTML = sortedCategories.map(buildSection).join("");

  const categories = sortedCategories
    .filter(({ hidden }) => !hidden)
    .map(({ slug }) => slug);

  let productsGroupedByCategory = {};
  products.forEach(product => {
    const { category } = product;
    if (!productsGroupedByCategory[category]) {
      productsGroupedByCategory[category] = [];
    }
    productsGroupedByCategory[category].push(product);
  });

  categories.forEach(category => {
    const categoriesContainer = document.querySelector(`.${category}-container`);
    if (!categoriesContainer) return;

    const categoryProducts = productsGroupedByCategory[category];
    if (!categoryProducts || !categoryProducts.length) {
      console.log(`No products found for category: ${category}`);
      categoriesContainer.innerHTML = '<div class="w-full py-6 text-center text-gray-500">No products found in this category.</div>';
      return;
    }

    categoriesContainer.innerHTML = categoryProducts
      .map(product => productCardHTML(product))
      .join('');
  });

  // Add event listeners after rendering
  const addButtonElements = document.querySelectorAll(".js-add-meal-button");
  addButtonEventListeners(addButtonElements);

  const subtractQuantityElements = document.querySelectorAll(".subtract-quantity-js");
  subtractQuantityEventListeners(subtractQuantityElements);

  const addQuantityElements = document.querySelectorAll(".add-quantity-js"); 
  addQuantityEventListeners(addQuantityElements);

  const addToFavoriteButtonElement = document.querySelectorAll(".js-add-to-favorite-button");
  addToFavoriteEventListeners(addToFavoriteButtonElement);
  updateCartQuantity();
}


loadMenuPage();
