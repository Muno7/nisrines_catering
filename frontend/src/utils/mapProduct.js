export function mapProduct(p) {
  return {
    id: p.id,
    image: p.image,
    name: p.name,
    nameAr: p.name_ar || p.nameAr || '',
    ingredients: p.ingredients,
    category: p.category,
    day: p.day,
    price: p.price,
  }
}
