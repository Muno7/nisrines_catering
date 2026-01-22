import { getProduct } from "./products.js";

class Favorite {
  favoriteItems;
  #localStorageKey;

  constructor(localStorageKey) {
    this.#localStorageKey = localStorageKey;
    this.#loadFromStorage();
  }

  resetFavorite() {
    this.favoriteItems = [];
    this.saveToStorage();
  }
  
  

  getFavoriteItem(productId) {
    let matchProduct;
    this.favoriteItems.forEach((product) => {
      if (product.productId === productId) {
        matchProduct = product;
      }
    });
    return matchProduct;
  }

  #loadFromStorage() {
    this.favoriteItems = JSON.parse(
      localStorage.getItem(this.#localStorageKey)
    ) || [];
  }

  _testHookLoadFromStorage() {
    return this.#loadFromStorage();
  }

  saveToStorage() {
    localStorage.setItem(this.#localStorageKey, JSON.stringify(this.favoriteItems));
  }

  calculateFavoriteQuantity() {
    let totalQuantity = 0;
    this.favoriteItems.forEach(() => {
      totalQuantity += 1;
    });
    return totalQuantity;
  }

  updateQuantity(productId, newQuantity) {
    let matchProduct = this.getFavoriteItem(productId);
    matchProduct.quantity = newQuantity;
    this.saveToStorage();
  }
  
  buyAgain(productId) {
    let productIdMatch = this.getFavoriteItem(productId);
    if (productIdMatch) {
      productIdMatch.quantity += 1;
    } else {
      this.favoriteItems.push({
        productId,
        quantity: 1
      });
    }
    this.saveToStorage();

  }

  addToFavorite(productId) {
    let productIdMatch = this.getFavoriteItem(productId);
    if (productIdMatch) {
      this.favoriteItems = this.favoriteItems.filter(item => item.productId !== productId);
    } else {
      this.favoriteItems.push({ productId });
    }
    this.saveToStorage();
  }

  deleteItem(productId) {
    let productMatch;
    this.favoriteItems.forEach((item, index) => {
      if (item.productId === productId) {
        productMatch = index;
        this.favoriteItems.splice(productMatch, 1);
        this.saveToStorage();
        return;
      }
    });
  }

  removeUndefinedProducts() {
    this.favoriteItems = this.favoriteItems.filter(item => 
      item !== undefined && getProduct(item.productId) !== undefined
    );
    this.saveToStorage();
  }
}

export let favorite = new Favorite("favorite");