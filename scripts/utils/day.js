import { cart } from "../../data/cart";

function formatDay(day) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function setDayLabel(day) {
  day = formatDay(day);
  return `<label class="day-label-js bg-red-600 absolute left-0 top-0 text-white text-xs font-bold px-2 py-1 rounded-md transform shadow-md">${day}</label>`;
}

function getCurrentDay() {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  return daysOfWeek[now.getDay()];
}

function getCurrentHour() {
  const now = new Date();
  return now.getHours();
}

export function isProductAvailable(product) {
  const currentDay = getCurrentDay();
  const currentHour = getCurrentHour();
  const productDay = product.day;

  if (!productDay) return true; // No day label, product is always available

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const productDayIndex = daysOfWeek.indexOf(productDay);
  const currentDayIndex = daysOfWeek.indexOf(currentDay);

  if (productDayIndex < currentDayIndex) {
      return false; // Product day is before current day
  }

  if (productDayIndex === currentDayIndex && currentHour >= 17) { // adjust later
      return false; // Product day is today, but cutoff time has passed
  }

  return true;
}

export function showFriendlyNotification(currentDay, productDay) {
  const notificationOverlay = document.getElementById('notification-overlay');
  document.querySelector('.current-day').innerHTML = formatDay(currentDay);
  document.querySelectorAll('.product-day').forEach(element => {
    element.innerHTML = formatDay(productDay);
  });
  notificationOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  const closeButton = document.getElementById('notification-close-btn');
  closeButton.addEventListener('click', () => {
    notificationOverlay.classList.remove('show');
    document.body.style.overflow = '';
  });
}

export function setDeliveryDateInput() {
  const deliveryInput = document.getElementById('delivery-day');
  
  // Set minimum date to today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  // Format date to YYYY-MM-DD for input min attribute
  const minDate = today.toISOString().split('T')[0];
  deliveryInput.min = minDate;
  
  // Validate on change to prevent manual entry of past dates
  deliveryInput.addEventListener('change', (e) => {
    const selectedDate = new Date(e.target.value);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      deliveryInput.value = ''; // Clear invalid date
      const errorDiv = document.getElementById('delivery-day-error');
      errorDiv.textContent = 'Please select a future date';
      errorDiv.classList.remove('hidden');
    } else {
      document.getElementById('delivery-day-error').classList.add('hidden');
    }
  });
}

export function createOrderDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

export function formatDeliveryDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}