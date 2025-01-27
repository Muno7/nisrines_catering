import { cart } from '../../data/cart.js';
import { getProduct } from '../../data/products.js';
import { formatCurrency } from '../utils/money.js';
import { sendOrderConfirmationEmails } from './emailSender.js';
import { initializePhoneInput } from '../utils/phoneInput.js';

export function updatePlaceOrderButton() {
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (cart.cartItems.length === 0) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.classList.add('cursor-not-allowed', 'opacity-50');
    placeOrderBtn.innerHTML = 'No items in basket';
  } else {
    placeOrderBtn.disabled = false;
    placeOrderBtn.classList.remove('cursor-not-allowed', 'opacity-50');
    placeOrderBtn.innerHTML = 'Place Order';
  }
}

export function updateTotalPrice() {
  let subtotal = 0;
  cart.cartItems.forEach((cartItem) => {
    const product = getProduct(cartItem.productId);
    subtotal += product.getPrice(cartItem.portion) * cartItem.quantity;
  });
  const subtotalEl = document.getElementById('subtotal');
  subtotalEl.innerHTML = `<span translate="no">$</span>${subtotal.toFixed(2)}`;
  const fee = parseFloat(document.getElementById('delivery-fee').textContent.slice(1)) || 0;
  const total = subtotal + fee;
  const totalEl = document.getElementById('total');
  totalEl.innerHTML = `<span translate="no">$</span>${total.toFixed(2)}`;
}

function showError(inputElement, errorMessage) {
  const errorElement = document.getElementById(`${inputElement.id}-error`);
  errorElement.textContent = errorMessage;
  errorElement.classList.remove('hidden');
  inputElement.classList.add('border-red-500');
}

function hideError(inputElement) {
  const errorElement = document.getElementById(`${inputElement.id}-error`);
  errorElement.classList.add('hidden');
  inputElement.classList.remove('border-red-500');
}

function isValidPhoneNumber(phone) {
  const phoneRegex = /^\+\d{1,3}\d{8,13}$/;
  return phoneRegex.test(phone);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function renderPaymentSummary() {
  updatePlaceOrderButton();
  initializePhoneInput();
  const pickupBtn = document.getElementById('pickup-btn');
  const deliveryBtn = document.getElementById('delivery-btn');
  const deliveryAreaContainer = document.getElementById('delivery-area-container');
  const deliveryInfo = document.getElementById('delivery-info');
  const deliveryFeeContainer = document.getElementById('delivery-fee-container');
  const deliveryFee = document.getElementById('delivery-fee');
  const deliveryAreaSelect = document.getElementById('delivery-area');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const fullNameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email-address');
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
    let isValid = true;
    const isDelivery = !deliveryAreaContainer.classList.contains('hidden');
    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = countryCode + phoneNumberInput.value.trim();
    
    // Validate full name
    if (!fullNameInput.value.trim()) {
      showError(fullNameInput, 'Please enter your full name');
      isValid = false;
    } else {
        hideError(fullNameInput);
    }

    // Validate email
    if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
      showError(emailInput, 'Please enter a valid email address');
      isValid = false;
    } else {
        hideError(emailInput);
    }

    // Validate phone number
    if (!phoneNumberInput.value.trim() || !isValidPhoneNumber(phoneNumber)) {
      showError(phoneNumberInput, 'Please enter a valid phone number');
      isValid = false;
    } else {
        hideError(phoneNumberInput);
    }
    // Validate delivery specifics if delivery is selected
    if (isDelivery) {
      if (!deliveryAreaSelect.value) {
        showError(deliveryAreaSelect, 'Please select a delivery area');
        isValid = false;
      } else {
          hideError(deliveryAreaSelect);
      }

      if (!deliveryAddressInput.value.trim()) {
          showError(deliveryAddressInput, 'Please enter a delivery address');
          isValid = false;
      } else {
          hideError(deliveryAddressInput);
      }
    }

    // Prepare order details
    if (isValid) {
      const customerAddress = isDelivery ? `<strong>Delivery Address: </strong><a href="https://maps.google.com/?q=${deliveryAddressInput.value}" style="color: #3C4147; text-decoration: underline;">${deliveryAddressInput.value}</a>` : '';
      const fee = isDelivery ? parseFloat(formatCurrency(deliveryAreaSelect.value)) || 0 : 0;
      updateTotalPrice();
      const subtotal = parseFloat(document.getElementById('subtotal').textContent.slice(1));
      const total = parseFloat(document.getElementById('total').textContent.slice(1));

      // Send order confirmation emails
      sendOrderConfirmationEmails({
        customerName: fullNameInput.value,
        customerContact: phoneNumber,
        customerAddress: customerAddress,
        customerEmail: emailInput.value,
        deliveryFee: fee,
        subtotal: subtotal,
        totalPrice: total
      });
    }
  }


  pickupBtn.addEventListener('click', () => toggleDeliveryOption(false));
  deliveryBtn.addEventListener('click', () => toggleDeliveryOption(true));
  placeOrderBtn.addEventListener('click', handlePlaceOrder);
  updateTotalPrice();
};