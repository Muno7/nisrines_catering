import { formatCurrency } from "../scripts/utils/money.js";
import { cart, updateCartQuantity, renderAddedMessage } from "./cart.js";
import { favorite } from "./favorites.js";

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

  constructor(productDetails) {
    this.id = productDetails.id;
    this.image = productDetails.image;
    this.name = productDetails.name;
    this.category = productDetails.category;

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

  // Updated getPrice method to handle both scenarios
  getPrice() {
    if (this.single && this.family) {
      return formatCurrency(this.single);
    } else if (this.priceCents) {
      return formatCurrency(this.priceCents);
    }
  };
}

export function renderProductOverlay() {
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-product-title');
  const overlayPrice = document.getElementById('overlay-product-price');
  const overlayHeartInput = document.getElementById('heart-input');
  const overlayImage = document.getElementById('overlay-product-image');

  function attachOverlayOpenHandlers() {
    const productContainers = document.querySelectorAll('.product-container');

    productContainers.forEach((container) => {
      container.addEventListener('click', () => {
        openProductOverlay(container);
      });
    });
  }
  
  function openProductOverlay(container) {
    const { productId } = container.dataset;
    const product = getProduct(productId);
    
    // Set overlay content
    overlayTitle.textContent = product.name;
    overlayPrice.innerHTML = `<span translate="no">$</span>${product.getPrice()}`;
    overlayImage.src = product.image;
    overlayHeartInput.checked = favorite.favoriteItems.some((item) => item.productId === productId);
    
    // Update Add to Cart button
    const addCartButton = document.querySelector('.overlay-add-to-cart');
    addCartButton.dataset.productId = productId;
    
    renderPortionButtons(product);
    
    // Show overlay
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  }

  function renderPortionButtons(product) {
    const checkProductCategory = (productCategory, targetCategories) => {
      return targetCategories.includes(productCategory);
    };
    const targetedCategories = ["plat-du-jour", "soup", "salad"];
    const portionDiv = document.querySelector(".portion-div");
  
    if (checkProductCategory(product.category, targetedCategories)) {
      portionDiv.classList.remove('hidden')
      portionDiv.classList.add('flex')
    } else {
      portionDiv.classList.remove('flex')
      portionDiv.classList.add('hidden')
    }
  
    const familyPortionButton = document.querySelector('.family-portion-button');
    const singlePortionButton = document.querySelector('.single-portion-button');
  
    familyPortionButton.addEventListener('click', () => {
      document.getElementById('overlay-product-price').innerHTML = `<span translate="no">$</span>${formatCurrency(product.family)}`;
      familyPortionButton.classList.add('active');
      singlePortionButton.classList.remove('active');
    });
    singlePortionButton.addEventListener('click', () => { 
      document.getElementById('overlay-product-price').innerHTML = `<span translate="no">$</span>${formatCurrency(product.single)}`;
      singlePortionButton.classList.add('active');
      familyPortionButton.classList.remove('active');
    });
  }
  
  function attachOverlayCloseHandlers() {
    const closeOverlayButton = document.getElementById('closeOverlay');
    
    closeOverlayButton.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeOverlay();
    });
  }

  function closeOverlay() {
    overlay.classList.remove('show');
    updatePortionButtons();
    document.body.style.overflow = ''; // Re-enable body scroll
  }

  function updatePortionButtons() {
  const familyPortionButton = document.querySelector('.family-portion-button');
  const singlePortionButton = document.querySelector('.single-portion-button');

  familyPortionButton.classList.remove('active');
  singlePortionButton.classList.add('active');
  
}

  function attachQuantityHandlers() {
    const subtractBtn = document.querySelector('.overlay-subtract-quantity');
    const addBtn = document.querySelector('.overlay-add-quantity');
    const quantityDisplay = document.querySelector('.overlay-product-quantity');
    let quantity = 1;

    function updateQuantityDisplay() {
      quantityDisplay.textContent = quantity;
    }

    addBtn.addEventListener('click', () => {
      quantity++;
      updateQuantityDisplay();
    });

    subtractBtn.addEventListener('click', () => {
      if (quantity > 1) quantity--;
      updateQuantityDisplay();
    });

    const addCartButton = document.querySelector('.overlay-add-to-cart');
    addCartButton.addEventListener('click', () => {
      cart.addToCartOverlay(addCartButton.dataset.productId);
      renderAddedMessage(document.querySelector('.overlay-added-to-cart'));
      quantity = 1; // Reset quantity
      updateQuantityDisplay();
      updateCartQuantity();
    });
  }

  function attachFavoriteHandler() {
    const addToFavoriteButton = document.querySelector('.overlay-add-to-favorite');

    addToFavoriteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.tagName !== 'INPUT') return;
      const { productId } = document.querySelector('.overlay-add-to-cart').dataset;
      favorite.addToFavorite(productId);
      /* Sync heart status for both overlay and prodcut card */
      const hearInput = document.querySelector(`.js-heart-input-${productId}`)
      const checked = favorite.favoriteItems.some(item => item.productId === productId) ? true : false;
      hearInput.checked = checked
      console.log('Favorite items after update:', favorite.favoriteItems);
    });
  }

  // Initialize overlay functionality
  attachOverlayOpenHandlers();
  attachOverlayCloseHandlers();
  attachQuantityHandlers();
  attachFavoriteHandler();
}


export function productCardHTML(product) {
  const {id, name, image} = product;
  const checked = favorite.favoriteItems.some(item => item.productId === id) ? 'checked' : '';
  const productCard = `
  <div class="product-container w-[12rem] relative flex flex-col gap-2 shadow-[0_0_10px_rgba(0,0,0,0.15)] p-4 rounded-[10px]" data-product-id="${id}">
    <img class="w-[10rem] h-[10rem] object-cover rounded-[10px]" src="${image}" alt="">
      <label data-product-id="${id}" class="js-add-to-favorite-button shadow-sm product-heart-button absolute bg-white rounded-full p-[7px] top-6 right-6 cursor-pointer text-[8px] select-none transition duration-100">
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
      <p class="product-name-js text-xl font-bold h-[3.4rem] line-clamp-2 text-wrap">${name}</p>
      <div class="flex items-center gap-2">
        <p class="price-js"><span translate="no">$</span>${product.getPrice()}</p>
        <div class="js-added-to-cart-${id} flex gap-1 opacity-0 transition-all items-center text-sm text-customBrown">
          <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" class="w-[16px] h-[16px] fill-current">
            <path d="m12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm-.091,15.419c-.387.387-.896.58-1.407.58s-1.025-.195-1.416-.585l-2.782-2.696,1.393-1.437,2.793,2.707,5.809-5.701,1.404,1.425-5.793,5.707Z"/>
          </svg>
          <span translate="no">Added</span>
        </div>
        <button data-product-id="${id}" class="js-add-to-cart-button button-secondary rounded-full w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" class="fill-current h-[24px] w-[24px]" viewBox="0 0 24 24">
            <path d="M23.297,9.034c-.57-.657-1.396-1.034-2.267-1.034h-.086C20.445,3.506,16.625,0,12,0S3.555,3.506,3.056,8h-.056c-.87,0-1.695,.377-2.266,1.034S-.093,10.562,.03,11.425l1.061,7.424c.42,2.937,2.974,5.151,5.94,5.151h9.969c2.966,0,5.52-2.215,5.94-5.151l1.061-7.424c.123-.862-.134-1.733-.704-2.391ZM12,2c3.52,0,6.441,2.613,6.928,6H5.072c.487-3.387,3.408-6,6.928-6Zm10.021,9.142l-1.061,7.424c-.28,1.958-1.982,3.435-3.96,3.435H7.031c-1.979,0-3.681-1.477-3.96-3.435l-1.061-7.424c-.042-.291,.042-.574,.234-.797,.193-.223,.461-.345,.755-.345H21.03c.294,0,.562,.122,.756,.345,.192,.223,.276,.506,.234,.797Zm-9.021,1.858v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm5,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm-10,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Z"/>
          </svg>
        </button>
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