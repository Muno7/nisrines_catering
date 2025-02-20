import { cart } from "../models/cart.js";

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
  
  // Reset the delivery input value
  deliveryInput.value = '';
  deliveryInput.removeAttribute('readonly');
  deliveryInput.classList.remove('bg-gray-300');
  deliveryInput.classList.add('bg-gray-100');
  
  // Get today's date at the start of the day (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Set min attribute to today's date
  const formattedToday = formatDate(today);
  deliveryInput.setAttribute('min', formattedToday);
  
  // Disable Sundays and past dates
  deliveryInput.addEventListener('input', function() {
    if (!this.value) return;
    
    const selectedDate = new Date(this.value);
    
    // Check if selected date is a Sunday
    if (selectedDate.getDay() === 0) {
      showError('Delivery is not available on Sundays. Please select another day.');
      this.value = '';
      return;
    }
    
    // Clear error if date is valid
    hideError();
  });
  
  // Check if cart.day exists as a day name (e.g., "Wednesday")
  if (typeof cart !== 'undefined' && cart.day) {
    try {
      // Convert day name to the next occurrence of that day
      const nextDayOccurrence = getNextDayOccurrence(cart.day);
      
      if (nextDayOccurrence) {
        // Set the input value and make it readonly
        const formattedCartDate = formatDate(nextDayOccurrence);
        deliveryInput.value = formattedCartDate;
        deliveryInput.setAttribute('readonly', true);
        deliveryInput.classList.add('bg-gray-300');
        deliveryInput.classList.remove('bg-gray-100');
      }
    } catch (error) {
      console.error('Error processing cart.day:', error);
      // Don't set the value if there's an error parsing cart.day
    }
  }
  
  // Helper function to convert day name to the next occurrence of that day
  function getNextDayOccurrence(dayName) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const normalizedDayName = dayName.toLowerCase();
    
    if (!dayNames.includes(normalizedDayName)) {
      console.error('Invalid day name:', dayName);
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDayIndex = today.getDay();
    const targetDayIndex = dayNames.indexOf(normalizedDayName);
    // If it's the same day as today, use today's date
    if (todayDayIndex === targetDayIndex) {
      return today;
    }
    // Calculate days to add
    let daysToAdd = targetDayIndex - todayDayIndex;
    if (daysToAdd <= 0) {
      // If the day has already passed this week, get next week's occurrence
      daysToAdd += 7;
    }
    
    // If the target day is Sunday, find the next non-Sunday
    if (targetDayIndex === 0) {
      // Skip to Monday (add 1 more day)
      daysToAdd = (daysToAdd % 7) + 1;
    }
    
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + daysToAdd);
    
    return nextOccurrence;
  }
  
  // Helper function to format date as YYYY-MM-DD
  function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date in formatDate:', date);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // Helper functions for error handling
  function showError(message) {
    const errorElement = document.getElementById('delivery-day-error');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
  
  function hideError() {
    const errorElement = document.getElementById('delivery-day-error');
    errorElement.classList.add('hidden');
  }
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