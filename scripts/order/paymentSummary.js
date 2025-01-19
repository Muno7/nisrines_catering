document.addEventListener('DOMContentLoaded', function() {
  // Delivery toggle functionality
  const deliveryToggle = document.getElementById('delivery-toggle');
  const deliveryInfo = document.querySelector('.delivery-info');
  const deliveryFee = document.querySelector('.delivery-fee');
  const totalAmount = document.querySelector('.total-amount');
  const contactInfoTitle = document.querySelector('.contact-info-title');

  deliveryToggle.addEventListener('change', function() {
    deliveryInfo.classList.toggle('hidden', !this.checked);
    deliveryFee.classList.toggle('hidden', !this.checked);
    totalAmount.textContent = this.checked ? '$70.97' : '$65.97';
    contactInfoTitle.textContent = this.checked ? 'Customer Information' : 'Contact Information';
  });
});