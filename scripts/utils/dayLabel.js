export function setDayLabel(day) {
  day = day.charAt(0).toUpperCase() + day.slice(1);
  return `<label class="day-label bg-red-600 absolute left-6 top-6 text-white text-xs font-bold px-2 py-1 rounded-md transform shadow-md">${day}</label>`;
}