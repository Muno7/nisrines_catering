export const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const DAY_ORDER = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 }

export function capitalize(day) {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

// Plat-du-jour products are tied to a specific weekday and stop being
// orderable at 5pm on that day, once the day's batch is no longer fresh.
export function isProductAvailable(product) {
  const productDay = product.day
  if (!productDay) return true

  const now = new Date()
  const currentDay = DAYS_OF_WEEK[now.getDay()]
  const currentHour = now.getHours()
  const productDayIdx = DAYS_OF_WEEK.indexOf(productDay)
  const currentDayIdx = DAYS_OF_WEEK.indexOf(currentDay)

  if (productDayIdx < currentDayIdx) return false
  if (productDayIdx === currentDayIdx && currentHour >= 17) return false
  return true
}
