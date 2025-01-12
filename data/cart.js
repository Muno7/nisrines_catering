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
    ) || [
      {
        productId: "a340bfd3-ab33-4a7b-a674-99e316f7f5ef",
        quantity: 1
      },
      {
        productId: "19065253-0f98-4d61-8300-b262b316a3e7",
        quantity: 2
      },
      {
        productId: "da0c19b6-808a-4235-8acd-940877b07844",
        quantity: 1
      },
    ];
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
    let productIdMatch = this.getCartItem(productId);
    const selectorElement = document.querySelector(
      `.overlay-product-quantity`
    );
    const quantity = Number(selectorElement.textContent);
    if (productIdMatch) {
      productIdMatch.quantity += quantity;
    } else {
      this.cartItems.push({
        productId,
        quantity: quantity
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
        quantity: quantity
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
