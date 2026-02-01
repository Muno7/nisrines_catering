import { products, loadProducts } from "../models/products.js";
import { productCardHTML } from "../handlers/productHandler.js";
import { updateCartQuantity, addButtonEventListeners, subtractQuantityEventListeners, addQuantityEventListeners } from "../handlers/cartHandler.js";
import { addToFavoriteEventListeners } from "../handlers/favoriteHandler.js";
import { appendOverlayDiv, renderProductOverlay } from "../utils/overlay.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { initSlideshow } from "../utils/animations/slideShow.js";
import { animateFeatureCards } from "../utils/animations/featureCardAnimation.js";
import { renderLayout } from "../components/layout.js";

renderLayout("home");

const DAY_OPTIONS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_ORDER = Object.fromEntries(DAY_OPTIONS.map((day, index) => [day, index]));

async function loadHomePage() {
  initSlideshow();
  animateFeatureCards();
  setSiderbarNavigation();
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  renderPopularMealsGrid();
  appendOverlayDiv();
  renderProductOverlay();
}

function renderPopularMealsGrid() {
  const container = document.querySelector('.products-container');
  if (!container) return;

  const sortedPlatDuJour = products
    .filter((product) => product.category === "plat-du-jour")
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

  container.innerHTML = sortedPlatDuJour.map((product) => productCardHTML(product)).join('');

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

loadHomePage();
