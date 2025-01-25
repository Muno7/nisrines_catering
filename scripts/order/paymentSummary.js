import { cart } from '../../data/cart.js';
import { getProduct } from '../../data/products.js';
import { formatCurrency } from '../utils/money.js';

export function updateTotalPrice() {
  let subtotal = 0;
  cart.cartItems.forEach((cartItem) => {
    const product = getProduct(cartItem.productId);
    subtotal += product.getPrice(cartItem.portion) * cartItem.quantity;
  });
  const subtotalEl = document.getElementById('subtotal');
  subtotalEl.innerHTML = `<span translate="no">$</span>${subtotal.toFixed(2)}`;
  const fee = parseInt(document.getElementById('delivery-fee').textContent.slice(1)) || 0;
  const total = subtotal + fee;
  const totalEl = document.getElementById('total');
  totalEl.innerHTML = `<span translate="no">$</span>${total.toFixed(2)}`;
}

export function renderPaymentSummary() {
  const pickupBtn = document.getElementById('pickup-btn');
  const deliveryBtn = document.getElementById('delivery-btn');
  const deliveryAreaContainer = document.getElementById('delivery-area-container');
  const deliveryInfo = document.getElementById('delivery-info');
  const deliveryFeeContainer = document.getElementById('delivery-fee-container');
  const deliveryFee = document.getElementById('delivery-fee');
  const deliveryAreaSelect = document.getElementById('delivery-area');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const fullNameInput = document.getElementById('full-name');
  const phoneNumberInput = document.getElementById('phone-number');
  const deliveryAddressInput = document.getElementById('delivery-address');

  function toggleDeliveryOption(isDelivery) {
    // Update button states
    pickupBtn.classList.toggle('bg-white', !isDelivery);
    pickupBtn.classList.toggle('text-darkGray', !isDelivery);
    pickupBtn.classList.toggle('text-gray-600', isDelivery);
    pickupBtn.classList.toggle('bg-transparent', isDelivery);
    pickupBtn.setAttribute('aria-checked', !isDelivery);

    deliveryBtn.classList.toggle('bg-white', isDelivery);
    deliveryBtn.classList.toggle('text-darkGray', isDelivery);
    deliveryBtn.classList.toggle('text-gray-600', !isDelivery);
    deliveryBtn.classList.toggle('bg-transparent', !isDelivery);
    deliveryBtn.setAttribute('aria-checked', isDelivery);

    // Toggle sections visibility
    deliveryAreaContainer.classList.toggle('hidden', !isDelivery);
    deliveryInfo.classList.toggle('hidden', !isDelivery);
    deliveryInfo.classList.toggle('flex', isDelivery);
    deliveryFeeContainer.classList.toggle('hidden', !isDelivery);
    deliveryFeeContainer.classList.toggle('flex', isDelivery);

    if (!isDelivery) {
      deliveryAreaSelect.value = '';
      deliveryFee.innerHTML = '<span translate="no">$</span>0.00';
      updateTotalPrice();
    }
  }

  deliveryAreaSelect.addEventListener('change', function() {
    const fee = parseInt(this.value) || 0;
    deliveryFee.innerHTML = `<span translate="no">$</span>${formatCurrency(fee)}`;
    updateTotalPrice();
  });

  function handlePlaceOrder(e) {
    e.preventDefault();
    const isDelivery = !deliveryAreaContainer.classList.contains('hidden');
    
    // Validate required fields
    if (!fullNameInput.value || !phoneNumberInput.value) {
      alert('Please fill in all required fields');
      return;
    }

    if (isDelivery && (!deliveryAreaSelect.value || !deliveryAddressInput.value)) {
      alert('Please fill in all delivery information');
      return;
    }

    const fee = isDelivery ? parseInt(deliveryAreaSelect.value) || 0 : 0;
    const total = updateTotalPrice(fee);
  }

  pickupBtn.addEventListener('click', () => toggleDeliveryOption(false));
  deliveryBtn.addEventListener('click', () => toggleDeliveryOption(true));
  placeOrderBtn.addEventListener('click', handlePlaceOrder);
  updateTotalPrice();
};