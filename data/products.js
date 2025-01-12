import { formatCurrency } from "../scripts/utils/money.js";

export function getProduct(productId) {
  let matchedproduct;
  products.forEach((product) => {
    if (product.id === productId) {
      matchedproduct = product;
    }
  });
  return matchedproduct;
}

export class Product {
  id;
  image;
  name;
  priceCents;
  category;

  constructor(productDetails) {
    this.id = productDetails.id;
    this.image = productDetails.image;
    this.name = productDetails.name;
    this.priceCents = productDetails.priceCents;
    this.category = productDetails.category;
  }

  getPrice() {
    return `${formatCurrency(this.priceCents)}`;
  };
}

export let products = [];

export async function loadProducts() {
  try {
    const response = await fetch('./backend/products.json'); // Path to your JSON file
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const productData = await response.json(); // Parse the JSON file
    products = productData.map((productDetails) => new Product(productDetails)); // Convert each product into an instance of Product
    console.log('Products loaded:', products);
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

let timeoutState = new Map();
export function renderAddedMessage(messageElement) {
    if (timeoutState.has(messageElement)) {
        clearTimeout(timeoutState.get(messageElement));
    }
    messageElement.classList.add("opacity-1");
    messageElement.classList.remove("opacity-0");

    const timeoutId = setTimeout(() => {
        messageElement.classList.remove("opacity-1");
        messageElement.classList.add("opacity-0");
        timeoutState.delete(messageElement);
    }, 1000);

    timeoutState.set(messageElement, timeoutId);
}

export function openOverlay() {
  const productContainers = document.querySelectorAll('.product-container');
  const overlay = document.getElementById('overlay');
  const closeOverlayButton = document.getElementById('closeOverlay');
  const overlayTitle = document.getElementById('overlay-product-title');
  const overlayPrice = document.getElementById('overlay-product-price');
  //const overlayDescription = document.getElementById('overlay-product-description');
  const overlayImage = document.getElementById('overlay-product-image');
  

  // Open the overlay and populate data when a product container is clicked
  productContainers.forEach(container => {
    container.addEventListener('click', () => {
      const {productId} = container.dataset; // Get the id of the clicked container
      console.log(productId)
      
      // Get the product data based on the id
      const product = getProduct(productId);
      console.log(product)
      // Update overlay content with the product data
      overlayTitle.innerHTML = product.name;
      overlayPrice.innerHTML = `<span translate="no">$</span>${product.getPrice()}`;
      //overlayDescription.innerHTML = product.description;
      overlayImage.src = product.image;

      // Show the overlay

      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';  // Prevent body scroll when overlay is open
    });
  });

  // Close the overlay when the close button is clicked
  closeOverlayButton.addEventListener('click', () => {
    overlay.classList.remove('show');
    document.body.style.overflow = '';  // Re-enable body scroll
  });

  // close the overlay if clicked outside the content
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
}