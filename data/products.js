import { formatCurrency } from "../scripts/utils/money.js";
import { cart } from "./cart.js";
import { favorite } from "./favorites.js";
import { setDayLabel, isProductAvailable } from "../scripts/utils/day.js"

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

export function productCardHTML(product) {
  const {id, name, image} = product;
  const checked = favorite.favoriteItems.some(item => item.productId === id) ? 'checked' : '';
  if (!isProductAvailable(product)) {
   cart.deleteItem(id, 'single')
   cart.deleteItem(id, 'family')
   return '';
  }  
  const dayLabel = product.day ? setDayLabel(product.day) : '';

  const cartItem = cart.getCartItem(id, 'single');
  const displayedQuantity = cartItem ? cartItem.quantity : 1;
  const addButtonClass = cartItem ? "hidden" : "";
  const quantityControlClass = cartItem ? "" : "hidden";

  const productCard = `
  <div class="product-container product-container-js-${id} w-[12rem] relative flex flex-col gap-2 shadow-[0_0_10px_rgba(0,0,0,0.15)] p-4 rounded-[10px]" data-product-id="${id}">
    <div class="image-container-js-${id} relative w-full h-[10rem]" data-product-id="${id}">
      <img class="w-[10rem] h-[10rem] object-cover rounded-[10px]" src="images/salad-6.jpg" alt="">
      ${dayLabel}
    </div>
      <label data-product-id="${id}" class="js-add-to-favorite-button z-[3] shadow-sm product-heart-button absolute bg-white rounded-full p-[7px] top-6 right-6 cursor-pointer text-[8px] select-none transition duration-100">
        <input class="js-heart-input-${id} absolute opacity-0 cursor-pointer h-0 w-0" type="checkbox" ${checked}/>
        <div class="heart-checkmark h-[16px] w-[16px]">
          <svg viewBox="0 0 256 256">
            <rect fill="none" height="256" width="256"></rect>
            <path
              d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z"
              stroke-width="20px"
              stroke="#2a1810"
              fill="none"
            ></path>
          </svg>
        </div>
      </label>
    <div class="flex flex-col gap-2">
      <p class="product-name-js text-xl h-[3.4rem] line-clamp-2 text-wrap">${name}</p>
      <div class="flex items-center gap-2">
        <p class="price-js font-bold "><span translate="no">$</span>${product.getPrice('single')}</p>
        <div class="relative w-full">
          <!-- Add to Basket Button -->
          <button data-day="${product.day || ''}" data-product-id="${id}" class="js-add-meal-button js-add-meal-button-${id} flex w-full text-sm justify-center button-primary px-auto py-1 rounded-xl transition-opacity duration-300 ${addButtonClass}">
              Add
          </button>
          <!-- Quantity Controls (Initially Hidden) -->
          <div class="quantity-control-js-${id} flex justify-between items-center rounded-xl border-2 bg-gray-200 ${quantityControlClass}">
            <button data-product-id="${id}" class="subtract-quantity-js rounded-full transition-all active:bg-gray-300 w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>
            </button>
            <span class="item-quantity-js-${id} bg-white rounded-md text-l font-medium w-10 text-center">${displayedQuantity}</span>
            <button data-day="${product.day || ''}" data-product-id="${id}" class="add-quantity-js rounded-full transition-all active:bg-gray-300 w-6 h-6 flex items-center justify-center text-l">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  return productCard;
}

export let products = [];

export async function loadProducts() {
  try {
    const response = await fetch('./backend/products.json');
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