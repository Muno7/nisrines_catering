import { cart } from '../../data/cart.js';
import { getProduct } from '../../data/products.js';
import emailjs from '@emailjs/browser';

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
      
      // Optional: Show success message or redirect
      alert('Order submitted successfully! Confirmation emails have been sent.');
      
      // Optional: Redirect to a thank you page
      window.location.href = 'order-confirmation.html';
    })
    .catch((error) => {
      console.error('Error sending emails:', error);
      alert('There was an issue submitting your order. Please try again.');
    });
}