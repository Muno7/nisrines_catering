import { products, loadProducts } from "../../models/products.js";
import { productCardHTML } from "../handlers/productHandler.js";
import { updateCartQuantity, addButtonEventListeners, subtractQuantityEventListeners, addQuantityEventListeners } from '../handlers/cartHandler.js';
import { addToFavoriteEventListeners } from "../handlers/favoriteHandler.js";
import { appendOverlayDiv, renderProductOverlay } from "../utils/overlay.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { setCategoryScrollBehavior } from "../utils/animations/scrollBehavior.js";

async function loadMenuPage() {
  setSiderbarNavigation();
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  makeMenuLinksActive();
  renderMenuGrid();
  setCategoryScrollBehavior();
  appendOverlayDiv();
  renderProductOverlay();
}

function makeMenuLinksActive() {
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
  const categories = [
    "plat-du-jour",
    "appetizers",
    "star-of-the-week",
    "salad",
    "soup",
    "healthy-zone",
    "frozen",
    "special-items",
    "pastries",
    "soiree",
    "desserts",
  ];

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