import { favorite } from '../models/favorites.js';
import { favoritesEmptyHTML } from '../handlers/favoriteHandler.js';
import { loadProducts, getProduct } from '../models/products.js';
import { addButtonEventListeners, addQuantityEventListeners, subtractQuantityEventListeners, updateCartQuantity } from '../handlers/cartHandler.js';
import { cart } from '../models/cart.js';
import { setDayLabel, isProductAvailable } from '../utils/day.js';
import { appendOverlayDiv, renderProductOverlay } from "../utils/overlay.js";
import { setSiderbarNavigation } from '../utils/animations/sideBarAnimation.js';

async function loadFavoritePage() {
  setSiderbarNavigation();
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  renderFavoriteItems();
  appendOverlayDiv();
  renderProductOverlay();
}

function renderFavoriteItems() {
  favorite.removeUndefinedProducts()
  let favoriteHtml = "";  
  favorite.favoriteItems.forEach((item) => {
    const { productId } = item;
    const product = getProduct(productId);
    const { image, name } = product;
    if (!isProductAvailable(product)) {
      favorite.deleteItem(productId, 'single');
      favorite.deleteItem(productId, 'family');
      return '';
    }
    const cartItem = cart.getCartItem(productId, 'single');
    const displayedQuantity = cartItem ? cartItem.quantity : 1;
    const addButtonClass = cartItem ? "hidden" : "";
    const quantityControlClass = cartItem ? "" : "hidden";
    const dayLabel = product.day ? setDayLabel(product.day) : '';
    let html = `<div data-product-id="${productId}" class="js-cart-item-container js-cart-item-container-${productId} product-container relative bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-[10px] overflow-hidden">
                  <div class="flex flex-row gap-2 p-2 lg:gap-4">
                    <div class="image-container-js-${productId} relative flex-shrink-0">
                      <img class="w-[7rem] h-[7rem] lg:w-[10rem] lg:h-[10rem] object-cover rounded-[10px]" src="../../assets/images/${image}" alt="">
                      ${dayLabel}
                    </div>
                    <div class="flex flex-col justify-between gap-4 w-full lg:py-2 lg:gap-8">
                      <div class="flex flex-col">
                        <h3 class="product-name-js text-l md:text-xl font-bold line-clamp-2">${name}</h3>
                      </div>
                      <div class="flex justify-between items-center gap-4 w-full">
                        <div class="flex items-center gap-2">
                          <p class="price-js text-lg font-semibold"><span translate="no">$</span>${product.getPrice('single')}</p>
                          <div class="relative w-full">
                            <!-- Add to Basket Button -->
                            <button data-day="${product.day || ''}" data-product-id="${productId}" class="js-add-meal-button js-add-meal-button-${productId} flex w-full text-sm justify-center button-primary px-auto py-1 rounded-xl transition-opacity duration-300 ${addButtonClass}">
                                Add
                            </button>
                            <!-- Quantity Controls (Initially Hidden) -->
                            <div class="quantity-control-js-${productId} flex justify-between items-center rounded-xl border-2 bg-gray-200 ${quantityControlClass}">
                              <button data-product-id="${productId}" class="subtract-quantity-js rounded-full transition-all active:bg-gray-300 w-6 h-6 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>
                              </button>
                              <span class="item-quantity-js-${productId} bg-white rounded-md text-l font-medium w-10 text-center">${displayedQuantity}</span>
                              <button data-day="${product.day || ''}" data-product-id="${productId}" class="add-quantity-js rounded-full transition-all active:bg-gray-300 w-6 h-6 flex items-center justify-center text-l">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <button class="delete-quantity-link js-delete-link-${productId} js-delete-link text-red-500 hover:text-red-700 lg:absolute bottom-4 right-4" data-product-id="${productId}">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>`;
    favoriteHtml += html;
  });
  !favoriteHtml ? favoriteHtml = favoritesEmptyHTML() : favoriteHtml
  document.querySelector(".js-favorite-container").innerHTML = favoriteHtml;

  const addToCartButtonElement = document.querySelectorAll(".js-add-meal-button");
  addButtonEventListeners(addToCartButtonElement);

  const subtractQuantityElements = document.querySelectorAll(".subtract-quantity-js");
  subtractQuantityEventListeners(subtractQuantityElements);

  const addQuantityElements = document.querySelectorAll(".add-quantity-js"); 
  addQuantityEventListeners(addQuantityElements);

  updateCartQuantity();
  
  const deleteLinksElements = document.querySelectorAll(".js-delete-link");
  deleteLinksElements.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.stopPropagation();
      const { productId } = link.dataset;
      favorite.deleteItem(productId);
      renderFavoriteItems();
    });
  });

}

loadFavoritePage();