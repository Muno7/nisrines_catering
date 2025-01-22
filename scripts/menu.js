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
              inline: "center",
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

  const skeletonLoaderHTML = `
    <div class="product-container w-[12rem] h-[306px] relative flex flex-col gap-2 shadow-[0_0_10px_rgba(0,0,0,0.15)] p-4 rounded-[10px] animate-pulse">
      <div class="w-[10rem] h-[10rem] bg-gray-300 rounded-[10px]"></div>
      <div class="flex flex-col gap-2">
        <div class="bg-gray-300 h-6 w-3/4 rounded"></div>
        <div class="bg-gray-300 h-4 w-1/2 rounded"></div>
      </div>
    </div>
  `;

  function addSkeletonLoaders(containerSelector, count) {
    const container = document.querySelector(containerSelector);
    if (container) {
      container.innerHTML = '';
      for (let i = 0; i < count; i++) {
        container.innerHTML += skeletonLoaderHTML;
      }
    }
  }

  categories.forEach(category => {
    addSkeletonLoaders(`.${category}-container`, 6);
  });

  setTimeout(() => {
    let productsGroupedByCategory = [];
    products.forEach(product => {
      const { category } = product;
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
      categoriesContainer.innerHTML = '';
      categoryProducts.forEach(product => {
        const productCard = productCardHTML(product);
        categoriesContainer.innerHTML += productCard;
      });
    });

    const addToCartButtonElement = document.querySelectorAll(".js-add-to-cart-button");
    addToCartEventListeners(addToCartButtonElement);

    const addToFavoriteButtonElement = document.querySelectorAll(".js-add-to-favorite-button");
    addToFavoriteEventListeners(addToFavoriteButtonElement);
  }, 500);
}

loadMenuPage();