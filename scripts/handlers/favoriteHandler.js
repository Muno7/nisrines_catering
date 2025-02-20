import { favorite } from "../../models/favorites";

export function updateFavoriteQuantity() {
  let totalQuantity = favorite.calculateFavoriteQuantity();
  document.querySelector(".js-favorite-quantity").innerHTML = totalQuantity;
}

export function addToFavoriteEventListeners(buttonElement) {
  buttonElement.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.target.tagName !== 'INPUT') return;
        const { productId } = button.dataset;
        favorite.addToFavorite(productId);
    });
  });
}

export function favoritesEmptyHTML() {
  return `
    <div class="flex flex-col justify-center items-center gap-4 col-span-2">
      <div class="heart-checkmark w-10 h-10">
        <svg viewBox="0 0 256 256">
          <rect fill="none" height="256" width="256"></rect>
          <path d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z" stroke-width="20px" stroke="#2a1810" fill="none"></path>
        </svg>
      </div>
      <div data-testid="empty-cart-message" class="text-xl font-bold">
        Your favorites list is empty!
      </div>
      <a class="button-primary view-products-link" href="menu.html" data-testid="view-products-link">
        Explore Menu
      </a>
    </div>`
}


