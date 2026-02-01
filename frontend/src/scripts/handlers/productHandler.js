import { favorite } from '../models/favorites.js';
import { cart } from '../models/cart.js';
import { isProductAvailable, setDayLabel } from '../utils/day.js';
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js';

export function productCardHTML(product, preferredPortion = 'single') {
  const {id, image} = product;
  const displayName = product.getDisplayName();
  const imageSrc = resolveProductImageSrc(image, displayName, { pathPrefix: './public/assets/images/' });
  const checked = favorite.favoriteItems.some(item => item.productId === id) ? 'checked' : '';
  const pricePortion = preferredPortion === 'family' && typeof product.family === 'number' ? 'family' : 'single';
  const displayedPrice = product.getPrice(pricePortion) ?? product.getPrice('single');
  if (!isProductAvailable(product)) {
    cart.deleteItem(id, 'single');
    cart.deleteItem(id, 'family');
    return '';
  }
  const dayLabel = product.day ? setDayLabel(product.day) : '';

  const productCard = `
  <div class="product-container product-container-js-${id} relative flex flex-col gap-2 bg-surface border border-muted/30 p-2 rounded-[10px] transition-all duration-500 sm:hover:-translate-y-1 sm:hover:shadow-lg" data-product-id="${id}">
    <div class="image-container image-container-js-${id} relative h-[10rem] w-full" data-product-id="${id}">
      <img loading="lazy" class="w-full h-full object-cover rounded-[10px]" src="${imageSrc}" alt="${displayName}">
      ${dayLabel}
    </div>
      <label data-product-id="${id}" class="js-add-to-favorite-button z-[3] shadow-sm product-heart-button absolute bg-white rounded-full p-[7px] top-4 right-4 cursor-pointer text-[8px] select-none transition duration-100">
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
    <div class="flex flex-col p-2 gap-1 items-center text-center">
      <p class="product-name-js text-lg font-semibold leading-tight line-clamp-1 truncate text-accent notranslate w-full text-center" translate="no">${displayName}</p>
      <p class="price-js font-bold text-center"><span translate="no">$</span>${displayedPrice}</p>
    </div>
  </div>`;
  return productCard;
}
