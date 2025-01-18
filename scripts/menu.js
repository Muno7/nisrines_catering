import { products, loadProducts, productCardHTML, renderProductOverlay } from "../data/products.js";
import { updateCartQuantity, addToCartEventListeners } from "../data/cart.js";
import { addToFavoriteEventListeners } from "../data/favorites.js";

async function loadMenuPage() {
  try {
    await loadProducts();
  } catch (error) {
    console.log('unexpected error')
  }
  makeMenuLinksActive();
  renderMenuGrid();
  renderProductOverlay();
}

function makeMenuLinksActive() {
  updateCartQuantity();
  const menuLinks = document.querySelectorAll('.menu-links a');
  menuLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      menuLinks.forEach(item => item.classList.remove('active'));
      event.currentTarget.classList.add('active');
    });
  });
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".menu-links a");
  const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`.menu-links a[href="#${id}"]`);
    
          if (entry.isIntersecting) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`.menu-links a[href="#${id}"]`);
        
          if (entry.isIntersecting) {
            link.classList.add("active");
        
            // Scroll the nav to bring the link into view
            link.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "end",
            });
          } else {
            link.classList.remove("active");
          }
        });
        
      },
      {
        rootMargin: "-20% 0px -70% 0px",
      }
    );
  sections.forEach((section) => observer.observe(section));
}

function renderMenuGrid() {
  const categories = [
    "plat-du-jour",
    "appetizers",
    "star-of-the-week",
    "salad",
    "soup",
    "healthy-zone",
    "frozen",
    "special-items",
    "pastries",
    "soiree",
    "desserts",
  ];

  let productsGroupedByCategory = [];
  products.forEach(product => {
    const {category} = product;
    if (!productsGroupedByCategory[category]) {
      productsGroupedByCategory[category] = [];
    }
    productsGroupedByCategory[category].push(product);
  });

  categories.forEach(category => {
    const categoriesContainer = document.querySelector(`.${category}-container`);
    if (!productsGroupedByCategory[category]) {
      console.log(`No products found for category: ${category}`);
      return;
    }
    const categoryProducts = productsGroupedByCategory[category];
    categoryProducts.forEach(product => {
      const productCard = productCardHTML(product);
      categoriesContainer.innerHTML += productCard;
    });
  });   

  const addToCartButtonElement = document.querySelectorAll(".js-add-to-cart-button");
  addToCartEventListeners(addToCartButtonElement);

  const addToFavoriteButtonElement = document.querySelectorAll(".js-add-to-favorite-button");
  addToFavoriteEventListeners(addToFavoriteButtonElement);
}

loadMenuPage();