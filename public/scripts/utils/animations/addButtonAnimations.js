export function showAddedToBasketNotification(productCard) {
  showBasketNotification(productCard, true);
}

export function showRemovedFromBasketNotification(productCard) {
  showBasketNotification(productCard, false);
}

function showBasketNotification(productCard, isAdding) {
  // Create the notification element
  const notification = document.createElement('div');
  
  // Create and style the icon
  const icon = document.createElement('div');
  icon.innerHTML = `
    <div class="icon-circle">
      <svg xmlns="http://www.w3.org/2000/svg" class="fill-current h-[24px] w-[24px]" viewBox="0 0 24 24">
        <path d="M23.297,9.034c-.57-.657-1.396-1.034-2.267-1.034h-.086C20.445,3.506,16.625,0,12,0S3.555,3.506,3.056,8h-.056c-.87,0-1.695,.377-2.266,1.034S-.093,10.562,.03,11.425l1.061,7.424c.42,2.937,2.974,5.151,5.94,5.151h9.969c2.966,0,5.52-2.215,5.94-5.151l1.061-7.424c.123-.862-.134-1.733-.704-2.391ZM12,2c3.52,0,6.441,2.613,6.928,6H5.072c.487-3.387,3.408-6,6.928-6Zm10.021,9.142l-1.061,7.424c-.28,1.958-1.982,3.435-3.96,3.435H7.031c-1.979,0-3.681-1.477-3.96-3.435l-1.061-7.424c-.042-.291,.042-.574,.234-.797,.193-.223,.461-.345,.755-.345H21.03c.294,0,.562,.122,.756,.345,.192,.223,.276,.506,.234,.797Zm-9.021,1.858v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm5,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm-10,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Z"/>
      </svg>
    </div>
  `;
  
  // Create the text element
  const text = document.createElement('div');
  text.textContent = isAdding ? 'Added to basket' : 'Removed from basket';

  // Add icon and text to notification
  notification.appendChild(icon);
  notification.appendChild(text);
  
  const backgroundColor = isAdding ? '#E6F0EB' : '#FFEBEE';
  const textColor = isAdding ? '#005C45' : '#D32F2F';
  
  const isOverlay = productCard.closest('.show-message-js') !== null;
  const isFavoritesPage = window.location.href.includes('favorites.html');
  const shouldUseSmallSize = !isOverlay && isFavoritesPage && window.innerWidth < 768;
  
  notification.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateY(20px);
    background-color: ${backgroundColor};
    color: ${textColor};
    width: 101%;
    height: 101%;
    padding: 20px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: ${shouldUseSmallSize ? '12px' : '16px'};
    font-weight: 500;
    text-align: center;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${shouldUseSmallSize ? '8px' : '12px'};
  `;

  text.style.cssText = `
  max-width: 90%;
  white-space: normal;
  word-wrap: break-word;
`;

  icon.style.cssText = `
    width: ${shouldUseSmallSize ? '32px' : '40px'};
    height: ${shouldUseSmallSize ? '32px' : '40px'};
    color: ${textColor};
    position: relative;
  `;

  // Add styles for the icon circle and plus icon
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    .icon-circle {
      background-color: white;
      border-radius: 50%;
      width: ${shouldUseSmallSize ? '32px' : '40px'};
      height: ${shouldUseSmallSize ? '32px' : '40px'};
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .icon-circle svg {
      width: ${shouldUseSmallSize ? '20px' : '24px'};
      height: ${shouldUseSmallSize ? '20px' : '24px'};
    }
  `;
  document.head.appendChild(styleSheet);

  const originalOverflow = productCard.style.overflow;
  productCard.style.overflow = 'hidden';
  productCard.appendChild(notification);
  
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translate(-50%, -50%)';
  });

  // Hide and remove the notification after a delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translate(-50%, -50%) translateY(-20px)';

    // Remove the element and restore original overflow after the transition
    setTimeout(() => {
      productCard.removeChild(notification);
      productCard.style.overflow = originalOverflow;
      document.head.removeChild(styleSheet);
    }, 300);
  }, 1500);
}

export function revertToAddButton(productId, portion) {
  if (portion === 'family') return;
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