import { formatCurrency } from "../scripts/utils/money.js";

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
  priceCents;
  category;
  single;
  family;
  day;

  constructor(productDetails) {
    this.id = productDetails.id;
    this.image = productDetails.image;
    this.name = productDetails.name;
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
    if (this.single && this.family) {
      return portion === 'single' ? formatCurrency(this.single) : formatCurrency(this.family);
    } else if (this.priceCents) {
      return formatCurrency(this.priceCents);
    }
  };
}

export let products = [];

export async function loadProducts() {
  try {
    const response = await fetch('../public/data/products.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const productData = await response.json();
    products = productData.map((productDetails) => new Product(productDetails));
    console.log('Products loaded');
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}