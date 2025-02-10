import { showFriendlyNotification } from '../scripts/utils/day.js';
import { showAddedToBasketNotification, revertToAddButton, revertQuantityControl  } from '../scripts/utils/addButtonAnimations.js';

class Cart {
  cartItems;
  day;
  #localStorageKey;

  constructor(localStorageKey) {
    this.#localStorageKey = localStorageKey;
    this.#loadFromStorage();
  }

  resetCart() {
    this.cartItems = [];
    this.day = null;
    this.saveToStorage();
  }

  getCartItem(productId, portion) {
    return this.cartItems.find(
      (item) => item.productId === productId && item.portion === portion
    );
  }

  #loadFromStorage() {
    this.cartItems = JSON.parse(localStorage.getItem(this.#localStorageKey)) || [];
    if (this.cartItems.length > 0) {
      // Set the cart's day based on the first product with a day
      const firstProductWithDay = this.cartItems.find((item) => item.day);
      this.day = firstProductWithDay ? firstProductWithDay.day : null;
    } else {
      this.day = null;
    }
  }

  saveToStorage() {
    localStorage.setItem(this.#localStorageKey, JSON.stringify(this.cartItems));
  }

  calculateCartQuantity() {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  updateQuantity(productId, portion, newQuantity) {
    const matchProduct = this.getCartItem(productId, portion);
    if (matchProduct) {
      matchProduct.quantity = newQuantity;
      this.saveToStorage();
    }
  }

  addToBasket(productId, productDay, portion) {
    const currentDay = this.day;

    // Allow products without a day to always be added
    if (!productDay) {
      console.log('Adding product without a day.');
    } else if (currentDay && productDay && currentDay !== productDay) {
      // Prevent adding products with a mismatched day
      showFriendlyNotification(currentDay, productDay);
      return false;
    }
    if (!this.day && productDay) {
      this.day = productDay;
    }
    // Find or create the cart item
    let productIdMatch = this.getCartItem(productId, portion);
    if (productIdMatch) {
      productIdMatch.quantity += 1;
    } else {
      this.cartItems.push({
        productId,
        quantity: 1,
        portion,
        day: productDay || null, // Use null for products without a day
      });
    }
    // Update the UI and save to storage
    updateCartQuantity();
    this.saveToStorage();
    return true;
  }

  removeFromBasket(productId, portion) {
    const cartItem = this.getCartItem(productId, portion);
    if (cartItem) {
      cartItem.quantity -= 1;
      if (cartItem.quantity < 1) {
        this.deleteItem(productId, portion);
        revertToAddButton(productId, portion);
      }
    }
    this.saveToStorage();
  }

  deleteItem(productId, portion) {
    const productMatchIndex = this.cartItems.findIndex(
      (item) => item.productId === productId && item.portion === portion
    );
    if (productMatchIndex !== -1) {
      this.cartItems.splice(productMatchIndex, 1);

      // Check if the cart still contains items with the current day
      if (this.day) {
        const hasRemainingItemsWithDay = this.cartItems.some(
          (item) => item.day === this.day
        );
        if (!hasRemainingItemsWithDay) {
          this.day = null; // Reset the cart's day if no matching items remain
        }
      }

      this.saveToStorage();
    }
  }
}

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

export let cart = new Cart("cart");