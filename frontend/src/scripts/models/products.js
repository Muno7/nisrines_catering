import { formatCurrency } from "../utils/money.js";
import { API_BASE_URL } from "../../config.js";
import { getCurrentLanguage } from "../utils/language.js";

export function getProduct(productId) {
  let matchedproduct;
  products.forEach((product) => {
    if (product.id === productId) {
      matchedproduct = product;
    }
  });
  return matchedproduct;
}

export class Product {
  id;
  image;
  name;
  nameAr;
  ingredients;
  priceCents;
  category;
  single;
  family;
  day;

  constructor(productDetails) {
    this.id = productDetails.id;
    this.image = productDetails.image;
    this.name = productDetails.name;
    this.nameAr = productDetails.name_ar || productDetails.nameAr || "";
    this.ingredients = productDetails.ingredients;
    this.category = productDetails.category;
    this.day = productDetails.day;

    // Handle the case where either priceCents or price object is provided
    if (productDetails.priceCents) {
      this.priceCents = productDetails.priceCents;
      this.single = null;
      this.family = null;
    } else if (productDetails.price) {
      this.priceCents = null;
      this.single = productDetails.price.single;
      this.family = productDetails.price.family;
    }
  }
  
  getPrice(portion) {
    const hasSingle = typeof this.single === 'number';
    const hasFamily = typeof this.family === 'number';

    if (hasSingle && hasFamily) {
      return portion === 'family' ? formatCurrency(this.family) : formatCurrency(this.single);
    }

    if (hasSingle) {
      return formatCurrency(this.single);
    }

    if (hasFamily) {
      return formatCurrency(this.family);
    }

    if (this.priceCents) {
      return formatCurrency(this.priceCents);
    }
  };

  getDisplayName(lang = getCurrentLanguage()) {
    if (lang === 'ar' && this.nameAr) {
      return this.nameAr;
    }
    return this.name;
  }
}

export let products = [];

export async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const { data: productData } = await response.json();
    products = productData.map((productDetails) => new Product(productDetails));
    console.log('Products loaded');
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

export function refreshRenderedProductNames() {
  const lang = getCurrentLanguage();
  document.querySelectorAll('.product-container, .js-cart-item-container').forEach((container) => {
    const productId = container.dataset.productId;
    if (!productId) return;
    const product = getProduct(productId);
    if (!product) return;
    const displayName = product.getDisplayName(lang);
    const nameNode = container.querySelector('.product-name-js');
    if (nameNode) {
      nameNode.textContent = displayName;
      nameNode.setAttribute('translate', 'no');
      nameNode.classList.add('notranslate');
    }
    const imageNode = container.querySelector('img');
    if (imageNode) {
      imageNode.alt = displayName;
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("site-language-change", refreshRenderedProductNames);
}
