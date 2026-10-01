const PDFDocument = require("pdfkit");

const fs = require("fs");



const generateInvoicePDF = (
  invoiceData,
  path
) => {

  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(path));



  doc.fontSize(25)
     .text("STACKLY INVOICE");



  doc.moveDown();

  doc.fontSize(16);

doc.text(`Invoice ID : ${invoiceData.invoiceId}`);
doc.text(`Invoice Date : ${invoiceData.paymentDate || new Date().toLocaleString()}`);

doc.moveDown();

doc.fontSize(18).text("Customer Details");

doc.fontSize(14);
doc.text(`Name : ${invoiceData.user?.name || "-"}`);
doc.text(`Email : ${invoiceData.user?.email || "-"}`);
doc.text(`Mobile : ${invoiceData.user?.mobile || "-"}`);
doc.text(`Address : ${invoiceData.user?.address || "-"}`);

doc.moveDown();

doc.fontSize(18).text("Payment Details");

doc.fontSize(14);
doc.text(`Payment Method : ${invoiceData.paymentDetails?.method || "-"}`);
doc.text(`Bank : ${invoiceData.paymentDetails?.bank || "-"}`);
doc.text(`UPI ID : ${invoiceData.paymentDetails?.upiId || "-"}`);
doc.text(`Wallet : ${invoiceData.paymentDetails?.wallet || "-"}`);
doc.text(`Transaction ID : ${invoiceData.paymentDetails?.paymentId || "-"}`);
doc.text(`Order ID : ${invoiceData.paymentDetails?.orderId || "-"}`);

doc.moveDown();

doc.fontSize(18).text("Plan Details");

doc.fontSize(14);
doc.text(`Plan : ${invoiceData.planName || "-"}`);
doc.text(`Amount : ₹${invoiceData.amount}`);
doc.text(`GST : ₹${invoiceData.gst || 0}`);
doc.text(`Total : ₹${invoiceData.total || invoiceData.amount}`);
doc.text(`Status : ${invoiceData.status || "Paid"}`);


  doc.end();
};

module.exports = {
  generateInvoicePDF,
};