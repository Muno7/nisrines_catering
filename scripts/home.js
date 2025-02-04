import { products, loadProducts, productCardHTML, renderProductOverlay } from "../data/products.js";
import { updateCartQuantity, addToCartEventListeners } from "../data/cart.js";
import { addToFavoriteEventListeners } from "../data/favorites.js";

async function loadHomePage() {
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  renderPopularMealsGrid();
  renderProductOverlay();
}

function renderPopularMealsGrid() {
  updateCartQuantity();
  const container = document.querySelector('.products-container');
  let html = '';
  products.forEach(product => {
    if (product.category !== "plat-du-jour") {
      return;
    }
    const productCard = productCardHTML(product);
    html += productCard;
    container.innerHTML = html;
  });

  const addToCartButtonElement = document.querySelectorAll(".js-add-to-cart-button");
  addToCartEventListeners(addToCartButtonElement);

  const addToFavoriteButtonElement = document.querySelectorAll(".js-add-to-favorite-button");
  addToFavoriteEventListeners(addToFavoriteButtonElement);
}

function initSlideshow() {
  const slideContainer = document.querySelector('.js-slideshow-container');
  const slides = slideContainer.querySelectorAll('img');
  let currentIndex = 0;
  
  // Set initial styles
  slideContainer.style.transition = 'transform 2s ease';
  slideContainer.style.width = `${slides.length * 100}%`;
  slides.forEach(slide => {
    slide.style.width = `${100 / slides.length}%`;
  });
  
  function nextSlide() {
    currentIndex++;
    slideContainer.style.transform = `translateX(-${currentIndex * (100 / slides.length)}%)`;
    
    // When we reach the clone of the first slide
    if (currentIndex === slides.length - 1) {
      // Wait for the transition to complete
      setTimeout(() => {
        // Remove the transition temporarily
        slideContainer.style.transition = 'none';
        // Jump back to the first slide
        currentIndex = 0;
        slideContainer.style.transform = `translateX(0)`;
        // Restore the transition after a brief moment
        setTimeout(() => {
          slideContainer.style.transition = 'transform 1.5s ease';
        }, 50);
      }, 2000); // Match the transition duration
    }
  }
  
  // Auto advance every 5 seconds
  setInterval(nextSlide, 5000);
}

// Initialize slideshow when page loads
window.addEventListener('load', initSlideshow);

loadHomePage();