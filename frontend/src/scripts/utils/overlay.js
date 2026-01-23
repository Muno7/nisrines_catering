import { cart } from "../models/cart.js";
import { updateCartQuantity } from '../handlers/cartHandler.js';
import { getProduct } from "../models/products.js";
import { favorite } from "../models/favorites.js";
import { formatCurrency } from "./money.js";
import { showAddedToBasketNotification, revertQuantityControl } from "./animations/addButtonAnimations.js";

export function isOverlayOpen() {
  return document.getElementById('overlay').classList.contains('show');
}

export function appendOverlayDiv() {
  document.getElementById('overlay').innerHTML = `
        <div class="relative bg-white rounded-xl shadow-lg w-full max-w-[360px] h-[90vh] max-h-[700px] md:max-w-[720px] md:h-[85vh] flex flex-col md:flex-row overflow-hidden">
        <!-- Back Button -->
        <button id="closeOverlay-js" class="absolute top-2 left-2 z-10 bg-white rounded-full p-2 shadow-md lg:hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#2a1810]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <!-- Image Section -->
        <div class="show-message-js remove-from-basket-message-js relative w-full md:w-1/2 h-[40vh] md:h-full">
          <img id="overlay-product-image-js" src="" alt="" class="w-full h-full object-cover object-center">
          <!-- Heart button -->
          ${!window.location.href.includes('favorites.html') ? `
          <label class="overlay-add-to-favorite-js z-[3] shadow-md product-heart-button absolute bg-white rounded-full p-2 top-2 right-2 cursor-pointer text-[8px] select-none transition duration-100">
            <input id="heart-input-js" class="absolute opacity-0 cursor-pointer h-0 w-0" type="checkbox"/>
            <div class="heart-checkmark w-[24px] h-[24px]">
              <svg viewBox="0 0 256 256">
                <rect fill="none" height="256" width="256"></rect>
                <path d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z" stroke-width="20px" stroke="#2a1810" fill="none"></path>
              </svg>
            </div>
          </label>
          ` : ''}
        </div>
        <!-- Content Section -->
        <div class="flex flex-col bg-surface w-full md:w-1/2 h-[50vh] md:h-full overflow-hidden">
          <div class="flex-grow overflow-y-auto p-4 md:p-6">
            <div class="space-y-4">
              <div>
                <h1 id="overlay-product-title-js" class="text-xl md:text-2xl font-bold leading-tight"></h1>
              </div>
              <!-- Price and Portions -->
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span id="overlay-product-price-js" class="text-xl md:text-2xl font-bold"></span>
                </div>
                <div class="portion-container-js hidden items-center gap-2">
                  <button class="family-portion-button-js button-primary portion-button rounded-full h-full w-full flex items-center justify-center text-lg md:text-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fill-current w-[18px] h-[18px] md:w-[20px] md:h-[20px]">
                      <path d="m.213,9.145c-.341-.435-.264-1.063.171-1.404L8.919,1.062c1.814-1.419,4.348-1.42,6.162,0l8.535,6.679c.435.34.512.969.171,1.404-.197.252-.491.384-.788.384-.215,0-.433-.069-.615-.212L13.849,2.638c-1.088-.852-2.609-.852-3.697,0L1.616,9.316c-.436.34-1.063.262-1.403-.171Zm3.524,8.89c-2.166.591-3.737,2.679-3.737,4.965,0,.553.447,1,1,1s1-.447,1-1c0-1.379.973-2.684,2.263-3.035.533-.146.848-.695.702-1.228-.146-.534-.699-.847-1.228-.702Zm16.525,0c-.526-.146-1.082.168-1.228.702-.146.532.169,1.082.702,1.228,1.29.352,2.263,1.656,2.263,3.035,0,.553.447,1,1,1s1-.447,1-1c0-2.286-1.571-4.374-3.737-4.965Zm-15.763-7.035c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5-1.119-2.5-2.5-2.5Zm17.5,2.5c0-1.381-1.119-2.5-2.5-2.5s-2.5,1.119-2.5,2.5,1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5Zm-10-5.5c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5-1.119-2.5-2.5-2.5Zm0,7c-2.757,0-5,2.243-5,5v3c0,.553.447,1,1,1s1-.447,1-1v-3c0-1.654,1.346-3,3-3s3,1.346,3,3v3c0,.553.447,1,1,1s1-.447,1-1v-3c0-2.757-2.243-5-5-5Z"/>
                    </svg>
                  </button>
                  <button class="single-portion-button-js button-primary portion-button active rounded-full w-full h-full flex flex-col items-center justify-center text-lg md:text-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fill-current w-[18px] h-[18px] md:w-[20px] md:h-[20px]">
                      <path d="M12,12A6,6,0,1,0,6,6,6.006,6.006,0,0,0,12,12ZM12,2A4,4,0,1,1,8,6,4,4,0,0,1,12,2Z"/>
                      <path d="M12,14a9.01,9.01,0,0,0-9,9,1,1,0,0,0,2,0,7,7,0,0,1,14,0,1,1,0,0,0,2,0A9.01,9.01,0,0,0,12,14Z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="ingredients-js border-t border-gray-200 pt-4">
                <h2 class="font-bold text-lg mb-1">Ingredients</h2>
                <p id="overlay-product-description-js" class="text-sm md:text-md"></p>  
              </div>
            </div>
          </div>
          <!-- Sticky Add to Cart Section -->
          <div class="p-2 border-t border-gray-200 shadow-top mt-auto">
            <div class="relative w-full h-[46px]">
              <!-- Add to Basket Button -->
              <button class="overlay-add-button-js flex w-full h-full text-sm items-center justify-center button-primary px-auto py-auto transition-opacity duration-300">
                  Add to Basket
              </button>
              <!-- Quantity Controls (Initially Hidden) -->
              <div class="hidden overlay-quantity-control-js h-full bg-primary p-1 flex justify-between items-center rounded-full">
                <button class="overlay-subtract-quantity-js h-full w-[25%] rounded-full bg-surface lg:hover:bg-surface/70 transition-all active:bg-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[16px] h-[16px]"><path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>
                </button>
                <span class="overlay-item-quantity-js w-full rounded-md text-xl font-medium text-center">1</span>
                <button class="overlay-add-quantity-js h-full w-[25%] rounded-full bg-surface lg:hover:bg-surface/70 transition-all active:bg-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[16px] h-[16px]"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`
}

export function renderProductOverlay() {
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-product-title-js');
  const overlayPrice = document.getElementById('overlay-product-price-js');
  const overlayIngredients = document.getElementById('overlay-product-description-js');
  const overlayHeartInput = document.getElementById('heart-input-js');
  const overlayImage = document.getElementById('overlay-product-image-js');

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
    console.log(product);
    
    // Set overlay content
    overlayTitle.textContent = product.name;
    overlayPrice.innerHTML = `<span translate="no">$</span>${product.getPrice('single')}`;
    overlayIngredients.textContent = product.ingredients;
    overlayImage.src = `${product.image}`;
    if(overlayHeartInput) {
      overlayHeartInput.checked = favorite.favoriteItems.some((item) => item.productId === productId);
    }
    
    // Update Add to Cart button
    const addCartButton = document.querySelector('.overlay-add-button-js');
    addCartButton.dataset.productId = productId;
    
    renderPortionButtons(product);
    renderAddButton(productId, 'single');
    // Show overlay
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  }

  function renderPortionButtons(product) {
    const checkProductCategory = (productCategory, targetCategories) => {
      return targetCategories.includes(productCategory);
    };
    const targetedCategories = ["plat-du-jour", "soup", "salad"];
    const portionDiv = document.querySelector(".portion-container-js");
  
    if (checkProductCategory(product.category, targetedCategories)) {
      portionDiv.classList.remove('hidden')
      portionDiv.classList.add('flex')
    } else {
      portionDiv.classList.remove('flex')
      portionDiv.classList.add('hidden')
    }
  
    const familyPortionButton = document.querySelector('.family-portion-button-js');
    const singlePortionButton = document.querySelector('.single-portion-button-js');
  
    familyPortionButton.addEventListener('click', () => {
      document.getElementById('overlay-product-price-js').innerHTML = `<span translate="no">$</span>${formatCurrency(product.family)}`;
      familyPortionButton.classList.add('active');
      singlePortionButton.classList.remove('active');
      renderAddButton(product.id, 'family');
    });
    singlePortionButton.addEventListener('click', () => { 
      document.getElementById('overlay-product-price-js').innerHTML = `<span translate="no">$</span>${formatCurrency(product.single)}`;
      singlePortionButton.classList.add('active');
      familyPortionButton.classList.remove('active');
      renderAddButton(product.id, 'single');
    });
  }
  
  function attachOverlayCloseHandlers() {
    const closeOverlayButton = document.getElementById('closeOverlay-js');
    
    closeOverlayButton.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeOverlay();
    });
  }

  function closeOverlay() {
    overlay.classList.remove('show');
    updatePortionButtons();
    updateAddButton();
    document.body.style.overflow = ''; // Re-enable body scroll
  }

  function updatePortionButtons() {
  const familyPortionButton = document.querySelector('.family-portion-button-js');
  const singlePortionButton = document.querySelector('.single-portion-button-js');

  familyPortionButton.classList.remove('active');
  singlePortionButton.classList.add('active');
  
  }

  function overlayUpdateQuantityDisplay(cartItem, portion) {
    const overlayQuantityElement = document.querySelector(`.overlay-item-quantity-js`);
    const cardQuantityElement = document.querySelector(`.item-quantity-js-${cartItem.productId}`);
    overlayQuantityElement.textContent = cartItem ? cartItem.quantity : 0;
    if (portion === 'single') {
      cardQuantityElement.textContent = cartItem ? cartItem.quantity : 0;
    }
  }

  function renderAddButton(productId, portion) {
    const cartItem = cart.getCartItem(productId, portion);
    const addButtonElement = document.querySelector(`.overlay-add-button-js`);
    const quantityControlElement = document.querySelector(`.overlay-quantity-control-js`);
    if (cartItem) {
      overlayUpdateQuantityDisplay(cartItem, portion);
      quantityControlElement.classList.remove('hidden');
      addButtonElement.classList.add('hidden');
    } else {
      quantityControlElement.classList.add('hidden');
      addButtonElement.classList.remove('hidden');
    }
  }

  function updateAddButton() {
    const addButtonElement = document.querySelector('.overlay-add-button-js');
    const quantityControlElement = document.querySelector('.overlay-quantity-control-js');
    if (addButtonElement.classList.contains('hidden')) {
      quantityControlElement.classList.add('hidden');
      addButtonElement.classList.remove('hidden');
    }
  }

  function attachAddToBasketHandlers() {  
    const addButton = document.querySelector('.overlay-add-button-js');
    addButton.addEventListener('click', () => {
      const productId = addButton.dataset.productId;
      const product = getProduct(productId);
      const day = product.day || '';
      const portion = document.querySelector('.single-portion-button-js').classList.contains('active') ? 'single' : 'family';
      const isAdded = cart.addToBasket(productId, day, portion);
      if (isAdded) {
        if (portion === 'single') {revertQuantityControl(productId)} ;
        const cartItem = cart.getCartItem(productId, portion);
        overlayUpdateQuantityDisplay(cartItem, portion);
        showAddedToBasketNotification(document.querySelector(`.show-message-js`));
        updateCartQuantity();
        renderAddButton(productId, portion);
      }
    })
  }

  function attachQuantityControlHandlers() {
    const addQuantityButton = document.querySelector('.overlay-add-quantity-js');
    const subtractQuantityButton = document.querySelector('.overlay-subtract-quantity-js');
  
    addQuantityButton.addEventListener('click', () => {
      const productId = document.querySelector('.overlay-add-button-js').dataset.productId;
      const product = getProduct(productId);
      const day = product.day || '';
      const portion = document.querySelector('.single-portion-button-js').classList.contains('active') ? 'single' : 'family';
      
      const isAdded = cart.addToBasket(productId, day, portion);
      if (isAdded) {
        const cartItem = cart.getCartItem(productId, portion);
        overlayUpdateQuantityDisplay(cartItem, portion);
        updateCartQuantity();
      }
    });
  
    subtractQuantityButton.addEventListener('click', () => {
      const productId = document.querySelector('.overlay-add-button-js').dataset.productId;
      const portion = document.querySelector('.single-portion-button-js').classList.contains('active') ? 'single' : 'family';
      
      cart.removeFromBasket(productId, portion);
      const cartItem = cart.getCartItem(productId, portion);
      
      if (!cartItem) {
        renderAddButton(productId, portion);
      } else {
        overlayUpdateQuantityDisplay(cartItem, portion);
      }
      updateCartQuantity();
    });
  }

  function attachFavoriteHandler() {
    const addToFavoriteButton = document.querySelector('.overlay-add-to-favorite-js');
    if (!addToFavoriteButton) {
      return
    }

    addToFavoriteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.tagName !== 'INPUT') return;
      const { productId } = document.querySelector('.overlay-add-button-js').dataset;
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
  attachAddToBasketHandlers();
  attachQuantityControlHandlers();
  attachFavoriteHandler();
}