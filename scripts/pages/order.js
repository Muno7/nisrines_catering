import { renderOrderSummary } from "../handlers/order/orderSummary.js";
import { renderPaymentSummary } from "../handlers/order/paymentSummary.js";
import { loadProducts } from "../../models/products.js";
import { updateFavoriteQuantity } from "../handlers/favoriteHandler.js";
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