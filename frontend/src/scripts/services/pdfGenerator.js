import { formatCurrency } from "../utils/money.js";
import { getProduct } from "../models/products.js";

export async function generatePDF(orderData) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
  });

  // Set initial coordinates
  let y = 30;
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Add logo (improved quality)
  const logoWidth = 70; // Slightly increased size
  const logoX = (pageWidth - logoWidth) / 2;
  
  // Load and optimize the image
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = "https://nisrineskitchen.vercel.app/assets/icons/logo-2.png";
  await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
  });

  // Create a canvas to resize the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = logoWidth * 2; // Increased resolution
  canvas.height = logoWidth * 2;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Add the resized image to the PDF
  pdf.addImage(canvas.toDataURL('image/png', 1), "PNG", logoX, y, logoWidth, logoWidth);
  y += logoWidth + 20;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  const title = "Order Confirmation";
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, y);
  y += 25;

  // Restaurant Details
  pdf.setFontSize(10);
  
  pdf.text("Nisrine's Kitchen", pageWidth / 2, y, { align: "center" });
  y += 12;
  
  // Street address as link with blue underline
  const streetText = "Afif El Taybi Bchamoun street";
  const streetWidth = pdf.getTextWidth(streetText);
  pdf.setTextColor(0, 0, 255);
  pdf.text(streetText, pageWidth / 2, y, { align: "center" });
  const streetX = (pageWidth - streetWidth) / 2;
  pdf.setDrawColor(0, 0, 255);
  pdf.line(streetX, y + 2, streetX + streetWidth, y + 2);
  pdf.link(streetX, y - 10, streetWidth, 12, { url: `https://maps.app.goo.gl/fJw93KRPAKCYMnNW7` });
  y += 12;
  
  pdf.setTextColor(0, 0, 0);
  pdf.text("Beirut, Lebanon", pageWidth / 2, y, { align: "center" });
  y += 12;
  
  // Phone as WhatsApp link with blue underline
  const telText = "Tel: +961 71 226 934";
  const telWidth = pdf.getTextWidth(telText);
  pdf.setTextColor(0, 0, 255);
  const telX = (pageWidth - telWidth) / 2;
  pdf.text(telText, pageWidth / 2, y, { align: "center" });
  pdf.setDrawColor(0, 0, 255);
  pdf.line(telX, y + 2, telX + telWidth, y + 2);
  pdf.link(telX, y - 10, telWidth, 12, { url: `https://wa.me/96171226934` });
  pdf.setTextColor(0, 0, 0);
  y += 30;

  // Order Info
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(`Order #${orderData.orderNumber}`, margin, y);
  y += 15;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Order Date: ${orderData.orderDate}`, margin, y);
  y += 15;
  pdf.text(`Delivery/Pick-up Date: ${orderData.deliveryDate}`, margin, y);
  y += 30;

  // Customer Details
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Customer Details", margin, y);
  y += 15;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Name: ${orderData.customerName}`, margin, y); 
  y += 15;
  
  // Customer phone as WhatsApp link with blue underline
  pdf.text("Phone: ", margin, y);
  const customerPhone = orderData.customerContact;
  const phoneX = margin + pdf.getTextWidth("Phone: ");
  pdf.setTextColor(0, 0, 255);
  console.log(customerPhone)
  pdf.text(customerPhone, phoneX, y);
  pdf.setDrawColor(0, 0, 255);
  pdf.line(phoneX, y + 2, phoneX + pdf.getTextWidth(customerPhone), y + 2);
  pdf.link(phoneX, y - 10, pdf.getTextWidth(customerPhone), 12, 
          { url: `https://wa.me/${customerPhone.replace('+', '')}` });
  y += 15;
  
  pdf.setTextColor(0, 0, 0);
  if (orderData.customerAddress && orderData.googleMapsLink) {
    pdf.text(`Address: ${orderData.customerAddress}`, margin, y);
    y += 15;

    // Location link with blue underline
    pdf.text("Location: ", margin, y);
    const locationText = "View Location";
    const locationX = margin + pdf.getTextWidth("Location: ");
    pdf.setTextColor(0, 0, 255);
    pdf.text(locationText, locationX, y);
    pdf.setDrawColor(0, 0, 255);
    pdf.line(locationX, y + 2, locationX + pdf.getTextWidth(locationText), y + 2);
    pdf.link(locationX, y - 10, pdf.getTextWidth(locationText), 12, 
            { url: orderData.googleMapsLink });
    pdf.setTextColor(0, 0, 0);
  }
  y += 30;
  
  // Customer Notes
  if (orderData.customerNotes) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Customer Notes", margin, y);
    y += 15;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(orderData.customerNotes, margin, y);
    y += 30;
  }

  // Order Items
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Order Items", margin, y);
  y += 15;

  // Table headers
  pdf.setFontSize(10);
  const headers = ["Item", "Portion", "Quantity", "Price"];
  const itemColumnWidth = (pageWidth - margin * 2) * 0.5; // 50% for item column
  const otherColumnWidth = (pageWidth - margin * 2 - itemColumnWidth) / 3; // Evenly divide the rest
  
  // Draw header line
  pdf.setDrawColor(200);
  pdf.line(margin, y + 5, pageWidth - margin, y + 5);
  
  pdf.text(headers[0], margin, y);
  pdf.text(headers[3], pageWidth - margin - pdf.getTextWidth(headers[3]), y);
  pdf.text(headers[2], pageWidth - margin - otherColumnWidth, y);
  pdf.text(headers[1], pageWidth - margin - 2 * otherColumnWidth, y);
  y += 20;

  // Table content
  pdf.setFont("helvetica", "normal");
  console.log(orderData.items)
  orderData.items.forEach(item => {
      const product = getProduct(item.productId);
      const displayName = product.getDisplayName();
      let price;
      if (product.single && product.family) {
        if (item.portion === 'single') {
          price = formatCurrency(product.single);
        } else {
          price = formatCurrency(product.family);
        }
      } else if (product.priceCents) {
        price = formatCurrency(product.priceCents);
      }
      pdf.text(displayName, margin, y, { maxWidth: itemColumnWidth });
      pdf.text(item.portion, pageWidth - margin - 2 * otherColumnWidth, y);
      pdf.text(item.quantity.toString(), pageWidth - margin - otherColumnWidth, y);
      const priceText = `$${price}`;
      pdf.text(priceText, pageWidth - margin - pdf.getTextWidth(priceText), y);
      
      // Draw line after each item
      y += 10;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 15;
  });
  y += 10;


  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Payment Summary", margin, y);
  y += 15;
  // Totals - Right aligned
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const subtotalText = `$${orderData.subtotal.toFixed(2)}`;
  const deliveryFeeText = `$${orderData.deliveryFee.toFixed(2)}`;
  const totalText = `$${orderData.totalPrice.toFixed(2)}`;
  
  pdf.text("Subtotal:", margin, y);
  pdf.text(subtotalText, pageWidth - margin - pdf.getTextWidth(subtotalText), y);
  y += 15;
  
  pdf.text("Delivery Fee:", margin, y);
  pdf.text(deliveryFeeText, pageWidth - margin - pdf.getTextWidth(deliveryFeeText), y);
  y += 5;

  // Line before total
  pdf.setDrawColor(200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 15;

  pdf.setFont("helvetica", "bold");
  pdf.text("Total:", margin, y);
  pdf.text(totalText, pageWidth - margin - pdf.getTextWidth(totalText), y);
  y += 30;

  // Thank you message
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const thankYouMsg = "Thank you for choosing Nisrine's Kitchen!";
  const enjoyMsg = "We hope you enjoy your meal";
  pdf.text(thankYouMsg, pageWidth / 2, y, { align: "center" });
  y += 12;
  pdf.setFont("helvetica", "italic");
  pdf.text(enjoyMsg, pageWidth / 2, y, { align: "center" });

  // Save PDF
  return pdf.output("blob");
}
