import { renderOrderSummary } from "./order/orderSummary.js";
import { loadProducts } from "../data/products.js";
import { updateFavoriteQuantity } from "../data/favorites.js";

async function loadOrderPage() {
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  updateFavoriteQuantity();
  renderOrderSummary();
}

loadOrderPage();