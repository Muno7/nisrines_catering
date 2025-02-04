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