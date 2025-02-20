import { cart } from '../../models/cart.js';
import { showAddedToBasketNotification, revertQuantityControl} from '../utils/animations/addButtonAnimations.js';

export function updateCartQuantity() {
  let totalQuantity = cart.calculateCartQuantity();
  const basketQuantity = document.querySelector(".js-cart-quantity")
  basketQuantity.innerHTML = totalQuantity;
  basketQuantity.classList.add('quantity-changed');
  setTimeout(() => {
    basketQuantity.classList.remove('quantity-changed');
  }, 500);
}

export function updateCardQuantityDisplay(productId) {
  const quantityElement = document.querySelector(`.item-quantity-js-${productId}`);
  const cartItem = cart.getCartItem(productId, 'single')
  if (cartItem) {
    quantityElement.textContent = cartItem.quantity;
  } else {
    quantityElement.textContent = 1;
  }
}

export function addButtonEventListeners(addButtonElements) {
  addButtonElements.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const { productId, day } = button.dataset;
      const productContainer = document.querySelector(`.image-container-js-${productId}`);
      const isAdded = cart.addToBasket(productId, day, 'single');
      if (isAdded) { 
        revertQuantityControl(productId);
        showAddedToBasketNotification(productContainer);
        updateCardQuantityDisplay(productId);
        updateCartQuantity();
      } 
    });
  });
}

export function subtractQuantityEventListeners(subtractQuantityElements) {
  subtractQuantityElements.forEach(button => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const { productId } = button.dataset;
      cart.removeFromBasket(productId, 'single');
      updateCardQuantityDisplay(productId);
      updateCartQuantity();
    });
  });
}

export function addQuantityEventListeners(addQuantityElements) {
  addQuantityElements.forEach(button => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const { productId, day } = button.dataset;
      cart.addToBasket(productId, day, 'single');
      updateCardQuantityDisplay(productId);
      updateCartQuantity();
    });
  });
}