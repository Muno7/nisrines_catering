class Cart {
  cartItems;
  #localStorageKey;

  constructor(localStorageKey) {
    this.#localStorageKey = localStorageKey;
    this.#loadFromStorage();
  }

  resetCart() {
    this.cartItems = [];
    this.saveToStorage();
  }

  getCartItem(productId) {
    let matchProduct;
    this.cartItems.forEach((product) => {
      if (product.productId === productId) {
        matchProduct = product;
      }
    });
    return matchProduct;
  }

  #loadFromStorage() {
    this.cartItems = JSON.parse(
      localStorage.getItem(this.#localStorageKey)
    ) || [];
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

  updateQuantity(productId, newQuantity) {
    let matchProduct = this.getCartItem(productId);
    matchProduct.quantity = newQuantity;
    this.saveToStorage();
  }
  
  buyAgain(productId) {
    let productIdMatch = this.getCartItem(productId);
    if (productIdMatch) {
      productIdMatch.quantity += 1;
    } else {
      this.cartItems.push({
        productId,
        quantity: 1
      });
    }
    this.saveToStorage();

  }

  addToCartOverlay(productId) {
    const selectorElement = document.querySelector(
      `.overlay-product-quantity`
    );
    const quantity = Number(selectorElement.textContent);
    const family = document.querySelector('.family-portion-button');
    const portion = family.classList.contains('active') ? 'family' : 'single';
    let productIdMatch = this.cartItems.find(
      (item) => item.productId === productId && item.portion === portion
    );
    if (productIdMatch) {
      productIdMatch.quantity += quantity;
    } else {
      this.cartItems.push({
        productId,
        quantity: quantity,
        portion: portion
      });
    }
    this.saveToStorage();
  }

  addToCartCard(productId) {
    let productIdMatch = this.getCartItem(productId);
    const quantity = 1;
    if (productIdMatch) {
      productIdMatch.quantity += quantity;
    } else {
      this.cartItems.push({
        productId,
        quantity: quantity,
        portion: 'single'
      });
    }
    this.saveToStorage();
  }

  deleteItem(productId) {
    let productMatch;
    this.cartItems.forEach((item, index) => {
      if (item.productId === productId) {
        productMatch = index;
        this.cartItems.splice(productMatch, 1);
        this.saveToStorage();
        return;
      }
    });
  }
}

export function updateCartQuantity() {
  let totalQuantity = cart.calculateCartQuantity();
  document.querySelector(".js-cart-quantity").innerHTML = totalQuantity;
}



export let cart = new Cart("cart");
