import { renderOrderSummary } from "./order/orderSummary.js";
import { renderPaymentSummary } from "./order/paymentSummary.js";
import { loadProducts } from "../../models/products.js";
import { updateFavoriteQuantity } from "../../models/favorites.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";

async function loadOrderPage() {
  setSiderbarNavigation();
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  updateFavoriteQuantity();
  renderOrderSummary(); 
  renderPaymentSummary();
}

loadOrderPage();