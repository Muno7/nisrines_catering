import { cart } from '../../../models/cart.js';
import { getProduct } from '../../../models/products.js';
import { formatCurrency } from '../../utils/money.js';
import { initializePhoneInput } from '../../services/phoneInput.js';
import { LocationPicker } from "../../services/mapHandler.js";
import { setDeliveryDateInput, formatDeliveryDate, createOrderDate, isProductAvailable } from '../../utils/day.js';
import { generateOrderNumber, uploadPDFToFirebase } from '../../services/uploadPdf.js';

function showOverlay(title, message) {
  document.getElementById('overlayTitle').textContent = title;
  document.getElementById('overlayMessage').textContent = message;
  document.getElementById('overlay').classList.add('flex');
  document.getElementById('overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('flex');
  document.getElementById('overlay').classList.add('hidden');
  const title = document.getElementById('overlayTitle').textContent
  document.body.style.overflow = '';
  if (title === 'Order Placed Successfully!') {
    window.location.href = 'index.html';
  }
}

function setButtonLoading(isLoading) {
  const button = document.getElementById('place-order-btn');
  if (isLoading) {
      button.disabled = true;
      button.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
      `;
  } else {
      button.disabled = false;
      button.textContent = 'Place Order';
  }
}

function validateCartItems(cartItems) {
  for (const item of cartItems) {
    const product = getProduct(item.productId);
    if (!isProductAvailable(product)) {
      return false;
    }
  }
  return true;
}

function isValidDeliveryDate(date) {
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return selectedDate >= today;
}

async function placeOrder(orderData) {
  document.getElementById('overlayCloseBtn').addEventListener('click', hideOverlay);
  try {
      if (!validateCartItems(orderData.items)) {
          showOverlay('Error', 'Some items in your cart are no longer available');
          return;
      }
      // Generate and upload PDF
      const { downloadURL } = await uploadPDFToFirebase(orderData);
      // Send to WhatsApp
      const whatsappMessage = `Hello Nisrine! 👋\nI just placed an order via your website.\nHere's my order details: ${downloadURL}`;
      const whatsappLink = `https://wa.me/96171226934?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappLink, '_blank');

  } catch (error) {
      console.error('Error placing order:', error);
      showOverlay('Error', 'There was an error placing your order. Please try again.');
  } finally {
      setButtonLoading(false);
      cart.resetCart();
      showOverlay(
        'Order Placed Successfully!', 
        'Thank you for your order! We will process it shortly and get back to you through WhatsApp.'
      );
  }
}

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

function scrollToElement(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function renderPaymentSummary() {
  const locationPicker = new LocationPicker('cb2cbfa865a2de46');
  locationPicker.initialize();
  updatePlaceOrderButton();
  initializePhoneInput();
  setDeliveryDateInput();
  const pickupBtn = document.getElementById('pickup-btn');
  const deliveryBtn = document.getElementById('delivery-btn');
  const deliveryAreaContainer = document.getElementById('delivery-area-container');
  const deliveryInfo = document.getElementById('delivery-info');
  const deliveryFeeContainer = document.getElementById('delivery-fee-container');
  const deliveryFee = document.getElementById('delivery-fee');
  const deliveryAreaSelect = document.getElementById('delivery-area');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const fullNameInput = document.getElementById('full-name');
  const notesInput = document.getElementById('customer-notes')
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

  async function handlePlaceOrder(e) {
    setButtonLoading(true)
    e.preventDefault();
    let isValid = true;
    const isDelivery = !deliveryAreaContainer.classList.contains('hidden');
    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = countryCode + phoneNumberInput.value.trim();
    
    // Validate full name
    if (!fullNameInput.value.trim()) {
      showError(fullNameInput, 'Please enter your full name');
      scrollToElement(fullNameInput);
      isValid = false;
      setButtonLoading(false);
    } else {
        hideError(fullNameInput);
    }

    // Validate phone number
    if (!phoneNumberInput.value.trim() || !isValidPhoneNumber(phoneNumber)) {
      showError(phoneNumberInput, 'Please enter a valid phone number');
      scrollToElement(phoneNumberInput);
      isValid = false;
      setButtonLoading(false);
    } else {
        hideError(phoneNumberInput);
    }

    // Validate delivery specifics if delivery is selected
    if (isDelivery) {
      if (!deliveryAreaSelect.value) {
        showError(deliveryAreaSelect, 'Please select a delivery area');
        scrollToElement(deliveryAreaSelect);
        isValid = false;
        setButtonLoading(false);
      } else {
          hideError(deliveryAreaSelect);
      }

      if (!deliveryAddressInput.value.trim()) {
          showError(deliveryAddressInput, 'Please enter a delivery address');
          scrollToElement(deliveryAddressInput);
          isValid = false;
          setButtonLoading(false);
      } else {
          hideError(deliveryAddressInput);
      }

      if (!locationPicker.hasLocationSelected()) {         
        showError(document.getElementById('map'), 'Please select a location on the map');         
        scrollToElement(document.getElementById('map'));       
        isValid = false;
        setButtonLoading(false);
      } else {         
        hideError(document.getElementById('map'));       
      }
    }

    // Validate delivery date
    const deliveryDayInput = document.getElementById('delivery-day');
    if (!deliveryDayInput.value) {
      showError(deliveryDayInput, 'Please select a delivery date');
      scrollToElement(deliveryDayInput);
      isValid = false;
      setButtonLoading(false);
    } else if (!isValidDeliveryDate(deliveryDayInput.value)) {
      showError(deliveryDayInput, 'Delivery date cannot be in the past');
      scrollToElement(deliveryDayInput);
      isValid = false;
      setButtonLoading(false);
    } else {
      hideError(deliveryDayInput);
    }

    // Prepare order details
    if (isValid) {
      const customerAddress = isDelivery ? deliveryAddressInput.value : '';
      const fee = isDelivery ? parseFloat(formatCurrency(deliveryAreaSelect.value)) || 0 : 0;
      updateTotalPrice();
      const subtotal = parseFloat(document.getElementById('subtotal').textContent.slice(1));
      const total = parseFloat(document.getElementById('total').textContent.slice(1));

      // Send order confirmation emails
      await placeOrder({
        orderNumber: await generateOrderNumber(),
        orderDate: createOrderDate(),
        deliveryDate: formatDeliveryDate(deliveryDayInput.value),
        customerName: fullNameInput.value,
        customerContact: phoneNumber,
        customerAddress: customerAddress,
        googleMapsLink: locationPicker.getGoogleMapsLink(),
        customerNotes: notesInput.value,
        items: cart.cartItems,
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