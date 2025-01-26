import { cart } from '../../data/cart.js';
import { getProduct } from '../../data/products.js';
import emailjs from '@emailjs/browser';

function showOverlay(title, message) {
  document.getElementById('overlayTitle').textContent = title;
  document.getElementById('overlayMessage').textContent = message;
  document.getElementById('overlay').classList.add('flex');
  document.getElementById('overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('flex');
  document.getElementById('overlay').classList.add('hidden');
  document.body.style.overflow = '';
  window.location.href = 'index.html';
}

function setButtonLoading(isLoading) {
  const button = document.getElementById('place-order-btn');
  if (isLoading) {
      button.disabled = true;
      button.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
      `;
  } else {
      button.disabled = false;
      button.textContent = 'Place Order';
  }
}
// Initialize EmailJS (make sure to replace with your actual user ID)
emailjs.init("v8m5QOh60gKq3MDQL");

function generateCartItemsHtml(items) {
  return items.map(item => {
    const product = getProduct(item.productId);
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-bottom: 20px; border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
              <td style="padding: 0; background-color: #ffffff;">
                  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                      <tr>
                          <td style="width: 120px; padding: 8px; vertical-align: top;">
                              <img src="${product.image}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          </td>
                          <td style="vertical-align: top; padding: 5px;">
                              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                                  <tr>
                                      <td style="padding-bottom: 8px;">
                                          <p style="font-weight: bold; font-size: 12px; color: #2D3748; margin: 0;">${product.name}</p>
                                  </td>
                                  </tr>
                                  <tr>
                                      <td style="padding-bottom: 4px;">
                                          <p style="margin: 0; color: #4A5568; font-size: 10px;">Portion: ${item.portion}</p>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="padding-bottom: 4px;">
                                          <p style="margin: 0; color: #4A5568; font-size: 10px;">Quantity: ${item.quantity}</p>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                          <p style="margin: 0; font-weight: bold; color: #2D3748; font-size: 12px;">$${(product.getPrice(item.portion) * item.quantity).toFixed(2)}</p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
    `;
  }).join('');
}

export function sendOrderConfirmationEmails(orderDetails) {
  setButtonLoading(true);
  // Calculate subtotal from cart items
  const cartItemsHtml = generateCartItemsHtml(cart.cartItems);

  // Prepare template parameters
  const templateParams = {
    customerName: orderDetails.customerName,
    customerAddress: orderDetails.customerAddress,
    customerContact: orderDetails.customerContact,
    cartItemsHtml: cartItemsHtml,
    subtotal: orderDetails.subtotal.toFixed(2),
    deliveryFee: orderDetails.deliveryFee.toFixed(2),
    totalPrice: orderDetails.totalPrice.toFixed(2),
    customerEmail: orderDetails.customerEmail,
  };

  // Send email to customer
  emailjs.send('service_9ojvunu', 'template_i0rz3o7', templateParams)
    .then(() => {
      // Send email to owner
      return emailjs.send('service_9ojvunu', 'template_8puzg7p', templateParams);
    })
    .then(() => {
      // Clear cart after successful email send
      cart.resetCart();
      showOverlay('Order Placed Successfully!', 'Thank you for your order! You will receive a confirmation email shortly.');
    })
    .catch((error) => {
      console.error('Error sending emails:', error);
      showOverlay('Error', 'There was an issue submitting your order. Please try again.');
    })
    .finally(() => {
      setButtonLoading(false);
    });
}

document.getElementById('overlayCloseBtn').addEventListener('click', hideOverlay);