import { renderOrderSummary } from "../handlers/order/orderSummary.js";
import { renderPaymentSummary } from "../handlers/order/paymentSummary.js";
import { loadProducts } from "../models/products.js";
import { updateFavoriteQuantity } from "../handlers/favoriteHandler.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { renderLayout } from "../components/layout.js";

async function loadOrderPage() {
  renderLayout("order", { useFavoriteIcon: true });
  setSiderbarNavigation();
  showComingSoonOverlay();
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  updateFavoriteQuantity();
  renderOrderSummary(); 
  renderPaymentSummary();
}

function showComingSoonOverlay() {
  const overlay = document.getElementById("coming-soon-overlay");
  if (!overlay) return;

  overlay.classList.remove("hidden");
  overlay.classList.add("flex");

  const navButtons = overlay.querySelectorAll(".js-coming-soon-nav");
  navButtons.forEach((button) => {
    const target = button.getAttribute("data-target");
    if (!target) return;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = target;
    });
  });
}

loadOrderPage();
