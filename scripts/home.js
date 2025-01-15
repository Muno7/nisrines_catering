import { products, loadProducts, productCardHTML, openOverlay} from "../data/products.js";
import { updateCartQuantity, addToCartEventListeners } from "../data/cart.js";
import { addToFavoriteEventListeners } from "../data/favorites.js";

async function loadHomePage() {
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  renderPopularMealsGrid();
  openOverlay();
}

function renderPopularMealsGrid() {
  updateCartQuantity();
  const container = document.querySelector('.products-container');
  products.forEach(product => {
    if (product.category !== "plat-du-jour") {
      return;
    }
    const productCard = productCardHTML(product);
    container.innerHTML += productCard;
  });

  const addToCartButtonElement = document.querySelectorAll(".js-add-to-cart-button");
  addToCartEventListeners(addToCartButtonElement);

  const addToFavoriteButtonElement = document.querySelectorAll(".js-add-to-favorite-button");
  addToFavoriteEventListeners(addToFavoriteButtonElement);
}

loadHomePage();