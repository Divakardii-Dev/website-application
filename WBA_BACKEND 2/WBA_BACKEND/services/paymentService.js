const razorpay = require("../config/razorpay");
const Invoice = require("../models/Invoice");

const createRazorpayOrder = async ({
  amount,
  planName = "",
  billingPeriod = "",
  itemType = "",
  templateId = null,
  templateName = "",
}) => {
  const options = {
    amount,
    currency: "INR",
    receipt: "receipt_" + Date.now(),

    notes: {
      planName,
      billingPeriod,
      itemType,
      templateId: templateId ? String(templateId) : "",
      templateName,
    },
  };

  const order = await razorpay.orders.create(options);

  return order;
};

const getPaymentDetails = async (paymentId) => {
  const payment = await razorpay.payments.fetch(paymentId);

  return {
    paymentId: payment.id,
    orderId: payment.order_id,
    amount: payment.amount / 100,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    bank: payment.bank || null,
    wallet: payment.wallet || null,
    vpa: payment.vpa || null,
    email: payment.email || null,
    contact: payment.contact || null,
    createdAt: payment.created_at,
  };
};


// Save invoice
const saveInvoice = async ({
  userId,
  paymentId,
  amount,
  gst = 0,
  planName = "",
  status = "Paid",
}) => {

  // Prevent duplicate invoice for same payment
  const existingInvoice = await Invoice.findOne({
    paymentId,
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const invoice = await Invoice.create({
    invoiceId: `INV-${Date.now()}`,
    userId,
    paymentId,
    amount,
    gst,
    total: amount + gst,
    planName,
    status,
  });

  return invoice;
};


// Get invoices for logged-in user
const getInvoices = async (userId) => {
  const invoices = await Invoice.find({
    userId,
  }).sort({
    createdAt: -1,
  });

  return invoices;
};


module.exports = {
  createRazorpayOrder,
  getPaymentDetails,
  saveInvoice,
  getInvoices,
};