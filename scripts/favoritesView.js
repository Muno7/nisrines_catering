import { favorite } from '../data/favorites.js';
import { loadProducts, getProduct, renderProductOverlay } from '../data/products.js';
import { addToCartEventListeners } from '../data/cart.js';
import { setDayLabel, isProductAvailable } from './utils/day.js';

async function loadFavoritePage() {
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  renderFavoriteItems();
  renderProductOverlay();
}

function renderFavoriteItems() {
  let favoriteHtml = "";  
  favorite.favoriteItems.forEach((item) => {
    const { productId } = item;
    const product = getProduct(productId);
    if (!isProductAvailable(product)) {
      favorite.deleteItem(productId);
      return '';
    }
    const { image, name } = product;
    const dayLabel = product.day ? setDayLabel(product.day) : '';
    let html = `<div data-product-id="${productId}" class="js-cart-item-container js-cart-item-container-${productId} product-container relative bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-[10px] overflow-hidden">
                  <div class="flex flex-row gap-2 p-2 lg:gap-4">
                    <div class="relative flex-shrink-0">
                      <img class="w-[7rem] h-[7rem] lg:w-[10rem] lg:h-[10rem] object-cover rounded-[10px]" src="images/salad-6.jpg" alt="">
                      ${dayLabel}
                      <div class="js-added-to-cart-${productId} absolute right-0 bottom-0 flex gap-1 bg-white bg-opacity-80 px-2 py-1 rounded-md opacity-0 transition-all items-center text-sm ">
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" class="w-[16px] h-[16px] fill-current">
                          <path d="m12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm-.091,15.419c-.387.387-.896.58-1.407.58s-1.025-.195-1.416-.585l-2.782-2.696,1.393-1.437,2.793,2.707,5.809-5.701,1.404,1.425-5.793,5.707Z"/>
                        </svg>
                        <span translate="no">Added</span>
                      </div>
                    </div>
                    <div class="flex flex-col justify-between gap-4 w-full lg:py-2 lg:gap-8">
                      <div class="flex flex-col">
                        <h3 class="product-name-js text-l md:text-xl font-bold line-clamp-2">${name}</h3>
                      </div>
                      <div class="flex justify-between items-center gap-4 w-full">
                        <div class="flex items-center gap-2">
                          <p class="price-js text-lg font-semibold"><span translate="no">$</span>${product.getPrice('single')}</p>
                          <button data-product-id="${productId}" data-day="${product.day || ''}" class="js-add-to-cart-button button-secondary rounded-full w-fit">
                            <svg xmlns="http://www.w3.org/2000/svg" class="fill-current h-6 w-6" viewBox="0 0 24 24">
                              <path d="M23.297,9.034c-.57-.657-1.396-1.034-2.267-1.034h-.086C20.445,3.506,16.625,0,12,0S3.555,3.506,3.056,8h-.056c-.87,0-1.695,.377-2.266,1.034S-.093,10.562,.03,11.425l1.061,7.424c.42,2.937,2.974,5.151,5.94,5.151h9.969c2.966,0,5.52-2.215,5.94-5.151l1.061-7.424c.123-.862-.134-1.733-.704-2.391ZM12,2c3.52,0,6.441,2.613,6.928,6H5.072c.487-3.387,3.408-6,6.928-6Zm10.021,9.142l-1.061,7.424c-.28,1.958-1.982,3.435-3.96,3.435H7.031c-1.979,0-3.681-1.477-3.96-3.435l-1.061-7.424c-.042-.291,.042-.574,.234-.797,.193-.223,.461-.345,.755-.345H21.03c.294,0,.562,.122,.756,.345,.192,.223,.276,.506,.234,.797Zm-9.021,1.858v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm5,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm-10,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Z"/>
                            </svg>
                          </button>
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
/*   !cartHtml ? cartHtml = cartEmptyHTML() : cartHtml */
  document.querySelector(".js-favorite-container").innerHTML = favoriteHtml;

  const addToCartButtonElement = document.querySelectorAll(".js-add-to-cart-button");
  addToCartEventListeners(addToCartButtonElement);
  
  const deleteLinksElements = document.querySelectorAll(".js-delete-link");
  deleteLinksElements.forEach((link) => {
    link.addEventListener("click", () => {
      const { productId } = link.dataset;
      favorite.deleteItem(productId);
      renderFavoriteItems();
    });
  });

}

loadFavoritePage();