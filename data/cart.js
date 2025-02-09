import { showFriendlyNotification } from '../scripts/utils/day.js';
import { revertToAddButton, revertQuantityControl, showAddedToBasketNotification } from './products.js';

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

  addToCartOverlay(productId, productDay) {
    return this.#addToCart(productId, productDay, '.overlay-product-quantity');
  }

  addToBasket(productId, productDay) {
    return this.#addToCart(productId, productDay, null);
  }

  #addToCart(productId, productDay, quantitySelector) {
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
    const quantity = quantitySelector
      ? Number(document.querySelector(quantitySelector).textContent)
      : 1;
    const family = document.querySelector('.family-portion-button');
    const portion = family.classList.contains('active') ? 'family' : 'single';
    // Find or create the cart item
    let productIdMatch = this.getCartItem(productId, portion);
    if (productIdMatch) {
      productIdMatch.quantity += quantity;
    } else {
      this.cartItems.push({
        productId,
        quantity,
        portion,
        day: productDay || null, // Use null for products without a day
      });
    }
    // Update the UI and save to storage
    updateCartQuantity();
    this.saveToStorage();
    renderAddedMessage(document.querySelector('.overlay-added-to-cart'));
    return true;
  }

  removeFromBasket(productId, portion) {
    const cartItem = this.getCartItem(productId, portion);
    if (cartItem) {
      cartItem.quantity -= 1;
      if (cartItem.quantity < 1) {
        this.deleteItem(productId);
        revertToAddButton(productId);
      }
    }
    this.saveToStorage();
  }

  deleteItem(productId) {
    const productMatchIndex = this.cartItems.findIndex(
      (item) => item.productId === productId
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

let timeoutState = new Map();

export function renderAddedMessage(messageElement) {
  if (timeoutState.has(messageElement)) {
    clearTimeout(timeoutState.get(messageElement));
  }
  messageElement.classList.add("opacity-1");
  messageElement.classList.remove("opacity-0");
  const timeoutId = setTimeout(() => {
    messageElement.classList.remove("opacity-1");
    messageElement.classList.add("opacity-0");
    timeoutState.delete(messageElement);
  }, 1000);
  timeoutState.set(messageElement, timeoutId);
}

function updateQuantityDisplay(productId) {
  const quantityElement = document.querySelector(`.item-quantity-js-${productId}`);
  const cartItem = cart.getCartItem(productId, 'single')
  if (cartItem) {
    quantityElement.textContent = cartItem.quantity;
  } else {
    quantityElement.textContent = 0;
  }
}

export function addButtonEventListeners(addButtonElements) {
  addButtonElements.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const { productId, day } = button.dataset;
      console.log(day)
      const productContainer = document.querySelector(`.product-container-js-${productId}`);
      const isAdded = cart.addToBasket(productId, day);
      if (isAdded) { 
        revertQuantityControl(productId) 
        showAddedToBasketNotification(productContainer);
        updateQuantityDisplay(productId);
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
      updateQuantityDisplay(productId);
      updateCartQuantity();
    });
  });
}

export function addQuantityEventListeners(addQuantityElements) {
  addQuantityElements.forEach(button => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const { productId, day } = button.dataset;
      cart.addToBasket(productId, day);
      updateQuantityDisplay(productId);
      updateCartQuantity();
    });
  });
}

export let cart = new Cart("cart");