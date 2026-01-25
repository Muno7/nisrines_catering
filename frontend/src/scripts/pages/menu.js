import { products, loadProducts } from "../models/products.js";
import { productCardHTML } from "../handlers/productHandler.js";
import { updateCartQuantity, addButtonEventListeners, subtractQuantityEventListeners, addQuantityEventListeners } from '../handlers/cartHandler.js';
import { addToFavoriteEventListeners } from "../handlers/favoriteHandler.js";
import { appendOverlayDiv, renderProductOverlay } from "../utils/overlay.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { setCategoryScrollBehavior } from "../utils/animations/scrollBehavior.js";
import { renderLayout } from "../components/layout.js";
import { API_BASE_URL } from "../../config.js";

const fallbackMenuCategories = [
  { id: 1, name: "Star of the Week", slug: "star-of-the-week", sort_order: 1 },
  { id: 3, name: "Plat du Jour", slug: "plat-du-jour", sort_order: 4 },
  { id: 4, name: "Appetizers", slug: "appetizers", sort_order: 5 },
  { id: 5, name: "Salad", slug: "salad", sort_order: 6 },
  { id: 6, name: "Soup", slug: "soup", sort_order: 7 },
  { id: 7, name: "Healthy zone", slug: "healthy-zone", sort_order: 8 },
  { id: 8, name: "Frozen", slug: "frozen", sort_order: 9 },
  { id: 9, name: "Special items", slug: "special-items", sort_order: 10 },
  { id: 10, name: "Pastries", slug: "pastries", sort_order: 11 },
  { id: 11, name: "Soirée", slug: "soiree", sort_order: 12 },
  { id: 12, name: "Desserts", slug: "desserts", sort_order: 13 },
  { id: 13, name: "Catering", slug: "catering", sort_order: 14, hidden: true },
];

let menuCategories = [...fallbackMenuCategories];

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
    console.warn("Categories response empty, using fallback data");
    menuCategories = [...fallbackMenuCategories];
  } catch (error) {
    console.warn("Error fetching categories, using fallback data", error);
    menuCategories = [...fallbackMenuCategories];
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

  const sortedCategories = getSortedMenuCategories();
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

    if (!productsGroupedByCategory[category]) {
      console.log(`No products found for category: ${category}`);
      categoriesContainer.innerHTML = '';
      return;
    }

    const categoryProducts = productsGroupedByCategory[category];
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
