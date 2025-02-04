import { showFriendlyNotification } from '../scripts/utils/day.js';

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
    let matchProduct;
    this.cartItems.forEach((product) => {
      if (product.productId === productId && product.portion === portion) {
        matchProduct = product;
      }
    });
    return matchProduct;
  }

  #loadFromStorage() {
    this.cartItems = JSON.parse(localStorage.getItem(this.#localStorageKey)) || [];
    if (this.cartItems.length > 0) {
      this.day = this.cartItems[0].day; // Set the day based on the first item in the cart
    } else {
      this.day = null;
    }
  }

  _testHookLoadFromStorage() {
    return this.#loadFromStorage();
  }

  saveToStorage() {
    localStorage.setItem(this.#localStorageKey, JSON.stringify(this.cartItems));
  }

  calculateCartQuantity() {
    let totalQuantity = 0;
    this.cartItems.forEach((item) => {
      totalQuantity += item.quantity;
    });
    return totalQuantity;
  }

  updateQuantity(productId, portion, newQuantity) {
    let matchProduct = this.getCartItem(productId, portion);
    if (matchProduct) {
      matchProduct.quantity = newQuantity;
      this.saveToStorage();
    }
  }

  addToCartOverlay(productId, productDay) {
    const currentDay = this.day;
    if (currentDay && productDay && currentDay !== productDay) {
      showFriendlyNotification(currentDay, productDay);
      return;
    }
    if (!this.day && productDay) {
      this.day = productDay; // Set the day based on the first product added
    }
    const selectorElement = document.querySelector(`.overlay-product-quantity`);
    const quantity = Number(selectorElement.textContent);
    const family = document.querySelector('.family-portion-button');
    const portion = family.classList.contains('active') ? 'family' : 'single';
    let productIdMatch = this.getCartItem(productId, portion);
    if (productIdMatch) {
      productIdMatch.quantity += quantity;
    } else {
      this.cartItems.push({
        productId,
        quantity: quantity,
        portion: portion,
        day: this.day
      });
    }
    updateCartQuantity();
    this.saveToStorage();
    renderAddedMessage(document.querySelector('.overlay-added-to-cart'));
  }

  addToCartCard(productId, productDay) {
    const currentDay = this.day;
    if (currentDay && productDay && currentDay !== productDay) {
      showFriendlyNotification(currentDay, productDay);
      return;
    }

    if (!this.day && productDay) {
      this.day = productDay; // Set the day based on the first product added
    }

    let productIdMatch = this.getCartItem(productId, 'single');
    const quantity = 1;
    if (productIdMatch) {
      productIdMatch.quantity += quantity;
    } else {
      this.cartItems.push({
        productId,
        quantity: quantity,
        portion: 'single',
        day: productDay
      });
    }
    this.saveToStorage();
    renderAddedMessage(document.querySelector(`.js-added-to-cart-${productId}`))
  }

  deleteItem(productId) {
    let productMatchIndex = -1;
    this.cartItems.forEach((item, index) => {
      if (item.productId === productId) {
        productMatchIndex = index;
      }
    });
    if (productMatchIndex !== -1) {
      this.cartItems.splice(productMatchIndex, 1);
      if (this.cartItems.length === 0) {
        this.day = null; // Reset the day if the cart is empty
      }
      this.saveToStorage();
    }
  }
}

export function updateCartQuantity() {
  let totalQuantity = cart.calculateCartQuantity();
  document.querySelector(".js-cart-quantity").innerHTML = totalQuantity;
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

export function addToCartEventListeners(buttonElement) {
  buttonElement.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const { productId } = button.dataset;
      const productDay = button.getAttribute('data-day'); // Get the day from the button attribute
      cart.addToCartCard(productId, productDay);
      updateCartQuantity();
    });
  });
}

export let cart = new Cart("cart");