import { cart } from '../../data/cart.js';
import { getProduct } from '../../data/products.js';
import { formatCurrency } from '../utils/money.js';
import { sendOrderConfirmationEmails } from './emailSender.js';

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

function isValidPhoneNumber(phone) {
  // Ensures the phone number:
  // 1. Starts with a '+' 
  // 2. Followed by 1-3 digit country code
  // 3. Then the rest of the number with only digits
  // 4. Total length between 10-15 digits (excluding '+')
  const phoneRegex = /^\+[1-9]\d{1,2}[0-9]{8,13}$/;
  return phoneRegex.test(phone);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    const isDelivery = !deliveryAreaContainer.classList.contains('hidden');
    
    // Validate full name
    if (!fullNameInput.value.trim()) {
      alert('Please enter your full name');
      return;
    }

    // Validate email
    if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate phone number
    if (!phoneNumberInput.value.trim() || !isValidPhoneNumber(phoneNumberInput.value)) {
      alert('Please enter a valid phone number.\n\nFormat: +[Country Code][Phone Number]\n\nExample:\n+12345678901\n+447911123456\n\nNotes:\n- Must start with a +\n- Country code is 1-3 digits\n- No spaces or dashes allowed');
      return;
    }

    // Validate delivery specifics if delivery is selected
    if (isDelivery) {
      if (!deliveryAreaSelect.value) {
        alert('Please select a delivery area');
        return;
      }

      if (!deliveryAddressInput.value.trim()) {
        alert('Please enter a delivery address');
        return;
      }
    }

    // Prepare order details
    const customerAddress = isDelivery ? `<strong>Delivery Address: </strong><a href="https://maps.google.com/?q=${deliveryAddressInput.value}" style="color: #3C4147; text-decoration: underline;">${deliveryAddressInput.value}</a>` : '';
    const fee = isDelivery ? parseFloat(formatCurrency(deliveryAreaSelect.value)) || 0 : 0;
    updateTotalPrice();
    const subtotal = parseFloat(document.getElementById('subtotal').textContent.slice(1));
    const total = parseFloat(document.getElementById('total').textContent.slice(1));

    // Send order confirmation emails
    sendOrderConfirmationEmails({
      customerName: fullNameInput.value,
      customerContact: phoneNumberInput.value,
      customerAddress: customerAddress,
      customerEmail: emailInput.value,
      deliveryFee: fee,
      subtotal: subtotal,
      totalPrice: total
    });
  }


  pickupBtn.addEventListener('click', () => toggleDeliveryOption(false));
  deliveryBtn.addEventListener('click', () => toggleDeliveryOption(true));
  placeOrderBtn.addEventListener('click', handlePlaceOrder);
  updateTotalPrice();
};