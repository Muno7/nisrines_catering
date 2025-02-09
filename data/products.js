import { formatCurrency } from "../scripts/utils/money.js";
import { cart, updateCartQuantity, renderAddedMessage } from "./cart.js";
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
    overlayPrice.innerHTML = `<span translate="no">$</span>${product.getPrice('single')}`;
    overlayImage.src = 'images/salad-6.jpg';
    if(overlayHeartInput) {
      overlayHeartInput.checked = favorite.favoriteItems.some((item) => item.productId === productId);
    }
    
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

    function resetQuantity() {
      quantity = 1
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
      const prodcutId = addCartButton.dataset.productId
      const product = getProduct(prodcutId);
      const productDay = product.day ? product.day : '';
      cart.addToCartOverlay(prodcutId, productDay);
      quantity = 1; // Reset quantity
      updateQuantityDisplay();
    });

    const closeOverlayButton = document.getElementById('closeOverlay');
    closeOverlayButton.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) resetQuantity();;
    });
  }

  function attachFavoriteHandler() {
    const addToFavoriteButton = document.querySelector('.overlay-add-to-favorite');
    if (!addToFavoriteButton) {
      return
    }

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
  if (!isProductAvailable(product)) return '';
  const dayLabel = product.day ? setDayLabel(product.day) : '';

  const cartItem = cart.getCartItem(id, 'single');
  const displayedQuantity = cartItem ? cartItem.quantity : 1;
  const addButtonClass = cartItem ? "hidden" : "";
  const quantityControlClass = cartItem ? "" : "hidden";

  const productCard = `
  <div class="product-container product-container-js-${id} w-[12rem] relative flex flex-col gap-2 shadow-[0_0_10px_rgba(0,0,0,0.15)] p-4 rounded-[10px]" data-product-id="${id}">
    <div class="image-container relative w-full h-[10rem]" data-product-id="${id}">
      <img class="w-[10rem] h-[10rem] object-cover rounded-[10px]" src="images/salad-6.jpg" alt="">
      ${dayLabel}
    </div>
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
      <p class="product-name-js text-xl h-[3.4rem] line-clamp-2 text-wrap">${name}</p>
      <div class="flex items-center gap-2">
        <p class="price-js font-bold "><span translate="no">$</span>${product.getPrice('single')}</p>
        <div class="relative w-full">
          <!-- Add to Basket Button -->
          <button data-day="${product.day || ''}" data-product-id="${id}" class="js-add-meal-button js-add-meal-button-${id} flex w-full text-sm justify-center button-primary px-auto py-1 transition-opacity duration-300 ${addButtonClass}">
              Add
          </button>
          <!-- Quantity Controls (Initially Hidden) -->
          <div class="quantity-control-js-${id} flex justify-between items-center rounded-full border-2 bg-gray-200 ${quantityControlClass}">
            <button data-product-id="${id}" class="subtract-quantity-js rounded-full lg:hover:bg-gray-300 transition-all active:bg-gray-500 w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>
            </button>
            <span class="item-quantity-js-${id} bg-white rounded-md text-l font-medium w-10 text-center">${displayedQuantity}</span>
            <button data-day="${product.day || ''}" data-product-id="${id}" class="add-quantity-js rounded-full lg:hover:bg-gray-200 transition-all active:bg-gray-300 w-6 h-6 flex items-center justify-center text-l">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  return productCard;
}

export function showAddedToBasketNotification(productCard) {
  // Create the notification element
  const notification = document.createElement('div');
  notification.textContent = 'Added to basket';
  notification.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    background-color: #4CAF50;
    color: white;
    width: 160px;
    padding: 10px;
    padding-inline: auto;
    border-radius: 20px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 10;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  `;

  // Ensure the product card can handle the overflow without scrollbar
  const originalOverflow = productCard.style.overflow;
  productCard.style.overflow = 'hidden';

  // Add the notification to the product card
  productCard.appendChild(notification);

  // Trigger the animation to show the notification
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  });

  // Hide and remove the notification after a delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-20px)';

    // Remove the element and restore original overflow after the transition
    setTimeout(() => {
      productCard.removeChild(notification);
      productCard.style.overflow = originalOverflow;
    }, 300);
  }, 2000);
}

export function revertToAddButton(productId) {
  let button = document.querySelector(`.js-add-meal-button-${productId}`);
  let quantityControls = document.querySelector(`.quantity-control-js-${productId}`);
  quantityControls.classList.add("hidden");
  button.classList.remove("hidden");
}

export function revertQuantityControl(productId) {
  let button = document.querySelector(`.js-add-meal-button-${productId}`);
  let quantityControls = document.querySelector(`.quantity-control-js-${productId}`);
  quantityControls.classList.remove("hidden");
  button.classList.add("hidden");
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