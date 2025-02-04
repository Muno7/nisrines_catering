import { getProduct } from "../../data/products.js";
import { cart } from "../../data/cart.js";
import { formatCurrency } from "../utils/money.js";
import { updatePlaceOrderButton, updateTotalPrice } from "./paymentSummary.js";
import { setDayLabel } from "../utils/day.js";

function setPortionLabel (portion) {
  return portion === 'single' ? `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fill-current w-[14px] h-[14px]">
    <path d="M12,12A6,6,0,1,0,6,6,6.006,6.006,0,0,0,12,12ZM12,2A4,4,0,1,1,8,6,4,4,0,0,1,12,2Z"/>
    <path d="M12,14a9.01,9.01,0,0,0-9,9,1,1,0,0,0,2,0,7,7,0,0,1,14,0,1,1,0,0,0,2,0A9.01,9.01,0,0,0,12,14Z"/>
  </svg>` : `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fill-current w-[14px] h-[14px]">
    <path d="m.213,9.145c-.341-.435-.264-1.063.171-1.404L8.919,1.062c1.814-1.419,4.348-1.42,6.162,0l8.535,6.679c.435.34.512.969.171,1.404-.197.252-.491.384-.788.384-.215,0-.433-.069-.615-.212L13.849,2.638c-1.088-.852-2.609-.852-3.697,0L1.616,9.316c-.436.34-1.063.262-1.403-.171Zm3.524,8.89c-2.166.591-3.737,2.679-3.737,4.965,0,.553.447,1,1,1s1-.447,1-1c0-1.379.973-2.684,2.263-3.035.533-.146.848-.695.702-1.228-.146-.534-.699-.847-1.228-.702Zm16.525,0c-.526-.146-1.082.168-1.228.702-.146.532.169,1.082.702,1.228,1.29.352,2.263,1.656,2.263,3.035,0,.553.447,1,1,1s1-.447,1-1c0-2.286-1.571-4.374-3.737-4.965Zm-15.763-7.035c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5-1.119-2.5-2.5-2.5Zm17.5,2.5c0-1.381-1.119-2.5-2.5-2.5s-2.5,1.119-2.5,2.5,1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5Zm-10-5.5c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5-1.119-2.5-2.5-2.5Zm0,7c-2.757,0-5,2.243-5,5v3c0,.553.447,1,1,1s1-.447,1-1v-3c0-1.654,1.346-3,3-3s3,1.346,3,3v3c0,.553.447,1,1,1s1-.447,1-1v-3c0-2.757-2.243-5-5-5Z"/>
  </svg>
  `
}

function cartEmptyHTML() {
  return `
  <div class="js-cart-summary cart-summary flex flex-col justify-center items-center gap-4">
      <img class="w-20 h-20" src="images/empty_basket.png">
      <div data-testid="empty-cart-message" class="text-xl">
        Your basket is empty!
      </div>
      <a class="button-primary view-products-link" href="menu.html" data-testid="view-products-link">
        View products
      </a>
  </div>`
}

export function renderOrderSummary() {
  let cartHtml = "";
  cart.cartItems.forEach((item) => {
    const { productId, quantity, portion } = item;

    const product = getProduct(productId);
    const { image, name } = product;
    let price;
    const portionLabel = setPortionLabel(portion);
    if (product.single && product.family) {
      if (portion === 'single') {
        price = formatCurrency(product.single);
      } else {
        price = formatCurrency(product.family);
      }
    } else if (product.priceCents) {
      price = formatCurrency(product.priceCents);
    }
    const dayLabel = product.day ? setDayLabel(product.day) : '';
    let html = `<div class="js-cart-item-container js-cart-item-container-${productId} relative bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-[10px] overflow-hidden">
                  <div class="flex flex-row gap-2 p-2 lg:gap-4">
                    <div class="relative flex-shrink-0">
                      <img class="w-[7rem] h-[7rem] lg:w-[10rem] lg:h-[10rem] object-cover rounded-[10px]" src="images/salad-6.jpg" alt="">
                      ${dayLabel}
                    </div>
                    <div class="flex flex-col justify-between gap-4 w-full lg:py-2 lg:gap-8">
                      <div class="flex flex-col gap-2 lg:gap-4">
                        <h3 class="product-name-js text-l md:text-xl font-bold">${name}</h3>
                        <label class="bg-lightGray text-white rounded-full max-w-[40px] h-full px-[2px] py-[3px] flex items-center justify-center text-xl">
                          ${portionLabel}
                        </label>
                      </div>
                      <div class="flex justify-between items-center gap-4 w-full">
                        <div class="flex gap-2">
                          <p class="price-js text-lg font-semibold"><span translate="no">$</span>${price}</p>
                          <div class="flex items-center rounded-full border-2">
                            <button data-portion="${portion}" data-product-id="${productId}" class="subtract-quantity-js rounded-full lg:hover:bg-gray-200 transition-all active:bg-gray-300 w-6 h-6 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>
                            </button>
                            <span class="item-quantity-js-${portion}-${productId} text-l font-medium w-8 text-center">${quantity}</span>
                            <button data-portion="${portion}" data-product-id="${productId}" class="add-quantity-js rounded-full lg:hover:bg-gray-200 transition-all active:bg-gray-300 w-6 h-6 flex items-center justify-center text-l">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="fill-current w-[12px] h-[12px]"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                            </button>
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
    cartHtml += html;
  });
  !cartHtml ? cartHtml = cartEmptyHTML() : cartHtml
  document.querySelector(".js-order-summary").innerHTML = cartHtml;
  
  const addQuantityButton = document.querySelectorAll(".add-quantity-js");
  addQuantityButton.forEach((button) => {
    button.addEventListener('click', () => {
      const { productId, portion } = button.dataset;
      const quantitySpan = document.querySelector(`.item-quantity-js-${portion}-${productId}`);
      const quantity = Number(quantitySpan.innerHTML) + 1;
      quantitySpan.innerHTML = quantity;
      cart.updateQuantity(productId, portion, quantity);
      updateTotalPrice();
    });
  });

  const subtractQuantityButton = document.querySelectorAll(".subtract-quantity-js");
  subtractQuantityButton.forEach((button) => {
    button.addEventListener('click', () => {
      const { productId, portion } = button.dataset;
      const quantitySpan = document.querySelector(`.item-quantity-js-${portion}-${productId}`);
      const quantity = Number(quantitySpan.innerHTML) - 1;
      if (quantity < 1) {
        return
      }
      quantitySpan.innerHTML = quantity;
      cart.updateQuantity(productId, portion, quantity);
      updateTotalPrice();
    });
  });

  const deleteLinksElements = document.querySelectorAll(".js-delete-link");
  deleteLinksElements.forEach((link) => {
    link.addEventListener("click", () => {
      const { productId } = link.dataset;
      cart.deleteItem(productId);
      renderOrderSummary();
      updateTotalPrice();
      updatePlaceOrderButton();
    });
  });

}