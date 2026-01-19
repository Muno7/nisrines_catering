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
  let html = '';
  products.forEach(product => {
    if (product.category !== "plat-du-jour") {
      return;
    }
    const productCard = productCardHTML(product);
    html += productCard;
    container.innerHTML = html;
  });

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
