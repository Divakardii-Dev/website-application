const crypto = require("crypto");
const Razorpay = require("razorpay");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Project = require("../models/Project");
const Cart = require("../models/Cart");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createEcommerceCheckoutOrder = async (req, res) => {
  try {
    
    const {
      workspaceId,
      items,
      customerName,
      customerEmail,
    } = req.body;

    // ==========================================
    // AUTH USER
    // ==========================================
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ==========================================
    // RESOLVE WORKSPACE FROM AUTH USER
    // ==========================================
    const workspace = await Project.findOne({
      userId: userId,
    }).sort({ createdAt: -1 });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found for this user",
      });
    }

    const resolvedWorkspaceId = workspace._id;

    // ==========================================
    // VALIDATIONS
    // ==========================================
    
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "Workspace ID is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    let totalAmount = 0;
    const orderProducts = [];

    // ==========================================
    // VALIDATE PRODUCTS
    // ==========================================

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.inventory < quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} has only ${product.inventory} item(s) available`,
        });
      }
      totalAmount += product.price * quantity;

      orderProducts.push({
        product: product._id,
        productName: product.name,
        quantity,
        price: product.price,
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    // ==========================================
    // CREATE RAZORPAY ORDER
    // ==========================================

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    // ==========================================
    // CREATE MONGODB ORDER
    // ========================================== 
    const mongoOrder = await Order.create({
      
      workspaceId: resolvedWorkspaceId,
      
      user: userId,

      products: orderProducts,

      totalAmount,

      paymentStatus: "Pending",

      orderStatus: "Pending",

      razorpayOrderId: razorpayOrder.id,

      paymentId: null,

      shippingAddress: "",

      phoneNumber: "",

      orderNotes: "",
    });
    
    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      order: mongoOrder,

      payment: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });

  } catch (error) {
    console.error("Checkout Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// VERIFY ECOMMERCE CHECKOUT PAYMENT
// =====================================================
exports.verifyEcommerceCheckoutPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================
    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        verified: false,
        message: "Payment verification details are required",
      });
    }

    // ==========================================
    // FIND MONGODB ORDER
    // ==========================================
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        verified: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // CHECK RAZORPAY ORDER ID
    // ==========================================
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        verified: false,
        message: "Razorpay order ID does not match",
      });
    }

    // ==========================================
    // VERIFY RAZORPAY SIGNATURE
    // ==========================================
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        verified: false,
        message: "Invalid payment signature",
      });
    }

    // ==========================================
    // FETCH PAYMENT FROM RAZORPAY
    // ==========================================
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    // ==========================================
    // CHECK PAYMENT AMOUNT
    // ==========================================
    const expectedAmount = Math.round(
      Number(order.totalAmount) * 100
    );

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return res.status(400).json({
        verified: false,
        message: "Invalid order amount",
      });
    }

    if (Number(payment.amount) !== expectedAmount) {
      return res.status(400).json({
        verified: false,
        message: "Payment amount does not match order amount",
      });
    }

    // ==========================================
    // UPDATE ORDER
    // ==========================================
    order.paymentId = razorpay_payment_id;
    order.paymentStatus = "Paid";
    order.orderStatus = "Processing";

    await order.save();

    // ==========================================
    // CLEAR CART
    // ==========================================
    const purchasedProductIds = order.products.map(
      (item) => item.product
    );

    await Cart.updateOne(
      { userId: order.user },
      {
        $pull: {
          products: {
            productId: {
              $in: purchasedProductIds,
            },
          },
        },
      }
    );

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    return res.status(200).json({
      verified: true,
      message: "Payment verified successfully",

      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        razorpayOrderId: order.razorpayOrderId,
        paymentId: order.paymentId,
      },

      payment: {
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: Number(payment.amount) / 100,
        currency: payment.currency,
        method: payment.method,
      },
    });
  } catch (error) {
    console.error(
      "Ecommerce Payment Verification Error:",
      error
    );

    return res.status(500).json({
      verified: false,
      message: error.message,
    });
  }
};
