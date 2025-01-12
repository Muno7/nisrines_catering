import { products, loadProducts } from "../data/products.js";
import { renderAddedMessage } from "../data/products.js";
import { openOverlay } from "../data/products.js";
import { cart } from "../data/cart.js";
import { updateCartQuantity } from "../data/cart.js";

async function loadHomePage() {
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  renderPopularMealsGrid();
  openOverlay();
}

function renderPopularMealsGrid() {
  updateCartQuantity();
  const container = document.querySelector('.products-container');
  products.forEach(product => {
    const {id, name, image, category} = product;
    if (category !== "star-of-the-week") {
      return;
    }
    const productCard = `
    <div class="product-container w-[12rem] relative flex flex-col gap-2 shadow-[0_0_10px_rgba(0,0,0,0.1)] p-4 rounded-[10px] " data-product-id="${id}" >
      <img class="w-[10rem] h-[10rem] object-cover rounded-[10px]" src="${image}" alt="">
      <button class="">
        <label class="product-heart-button absolute bg-white rounded-full p-[7px] top-6 right-6 cursor-pointer text-[8px] select-none transition duration-100">
          <input class="absolute opacity-0 cursor-pointer h-0 w-0"  type="checkbox" />
          <div class="heart-checkmark">
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
      </button> 
      <div class="flex flex-col gap-2">
        <p class="product-name-js text-xl font-bold h-[3.125rem] line-clamp-2 text-wrap">${name}</p>
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
    container.innerHTML += productCard;
  });

  const addToCartButtonElement = document.querySelectorAll(".js-add-to-cart-button");

  addToCartButtonElement.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        const { productId } = button.dataset;
        cart.addToCartCard(productId);
        updateCartQuantity();
        const messageElement = document.querySelector(
        `.js-added-to-cart-${productId}`
        );
        renderAddedMessage(messageElement);
    });
  });
}

loadHomePage();