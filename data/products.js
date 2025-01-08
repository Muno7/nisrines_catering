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

  constructor(productDetails) {
    this.id = productDetails.id;
    this.image = productDetails.image;
    this.name = productDetails.name;
    this.priceCents = productDetails.priceCents;
  }

  getPrice() {
    return `${formatCurrency(this.priceCents)}`;
  };
}

export let products = [];

export async function loadProducts() {
  try {
    const response = await fetch('./backend/products.json'); // Path to your JSON file
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const productData = await response.json(); // Parse the JSON file
    products = productData.map((productDetails) => new Product(productDetails)); // Convert each product into an instance of Product
    console.log('Products loaded:', products);
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}
