const Order = require("../models/Order");
const Cart = require("../models/Cart");

// GET ORDER SUMMARY
exports.getOrderSummary = async (req, res) => {
  try {
    const { userId, productIds } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (
      !Array.isArray(productIds) ||
      productIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one product ID is required",
      });
    }

    const cart = await Cart.findOne({ userId }).populate(
      "products.productId",
      "name price image"
    );

    if (!cart || cart.products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Select only requested products
    const selectedProducts = cart.products.filter((item) =>
      item.productId &&
      productIds.includes(item.productId._id.toString())
    );

    if (selectedProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Selected products not found in cart",
      });
    }

    const products = selectedProducts.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      image: item.productId.image,
      price: item.productId.price,
      quantity: item.quantity,
      subtotal: item.productId.price * item.quantity,
    }));

    const totalAmount = products.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        products,
        totalAmount,
      },
    });

  } catch (error) {
    console.error("Order Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET USER ORDERS
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.params.userId,
    })
      .populate("products.product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("products.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const formattedOrder = {
      _id: order._id,

      customerName: order.user?.name || "Guest",
      customerEmail: order.user?.email || "",

      status: order.orderStatus.toLowerCase(),

      paymentStatus:
        order.paymentStatus === "Paid"
          ? "completed"
          : order.paymentStatus === "Pending"
          ? "pending"
          : "failed",

        paymentId: order.paymentId || "",
        razorpayPaymentId: order.paymentId,
        razorpayOrderId: order.razorpayOrderId,

      items: order.products.map((item) => ({
        _id: item._id,
        productId: item.product?._id,
        name: item.productName || item.product?.name || "",
        quantity: item.quantity,
        price: item.price,
      })),

      subtotal: order.totalAmount,
      shippingCost: 0,
      totalAmount: order.totalAmount,

      shippingAddress: {
        address: order.shippingAddress,
        phone: order.phoneNumber,
      },

      paymentProvider: order.razorpayOrderId ? "razorpay" : "cod",

      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.paymentId,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return res.status(200).json({
      order: formattedOrder,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// GET ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const orders = await Order.find({ workspaceId })
      .populate("user")
      .populate("products.product");

    const formattedOrders = orders.map((order) => ({
      _id: order._id,

      customerName: order.user?.name || "Guest",
      customerEmail: order.user?.email || "",

      status: order.orderStatus.toLowerCase(),

      paymentStatus:
        order.paymentStatus === "Paid"
          ? "completed"
          : order.paymentStatus === "Pending"
          ? "pending"
          : "failed",

      totalAmount: order.totalAmount,

      createdAt: order.createdAt,

      items: order.products.map((item) => ({
        _id: item._id,
        productId: item.product?._id,
        name: item.productName || item.product?.name || "",
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    return res.json({
      orders: formattedOrders,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
  try {

    const {
      status,
      paymentStatus,
      paymentId,
    } = req.body;

    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("products.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (status) {

      const map = {
        pending: "Pending",
        confirmed: "Processing",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
      };

      order.orderStatus = map[status] || order.orderStatus;

      order.statusHistory.push({
        status: order.orderStatus,
      });
    }

    if (paymentStatus) {

      const paymentMap = {
        pending: "Pending",
        processing: "Pending",
        completed: "Paid",
        failed: "Failed",
        refunded: "Failed",
      };

      order.paymentStatus =
        paymentMap[paymentStatus] || order.paymentStatus;
    }

    if (paymentId) {
      order.paymentId = paymentId;
    }

    await order.save();

    return res.status(200).json({
      order: {
        _id: order._id,

        customerName: order.user?.name || "Guest",
        customerEmail: order.user?.email || "",

        status: order.orderStatus.toLowerCase(),

        paymentStatus:
          order.paymentStatus === "Paid"
            ? "completed"
            : order.paymentStatus === "Pending"
            ? "pending"
            : "failed",

        paymentId: order.paymentId,

        items: order.products.map((item) => ({
          _id: item._id,
          productId: item.product?._id,
          name: item.productName || item.product?.name,
          quantity: item.quantity,
          price: item.price,
        })),

        subtotal: order.totalAmount,
        shippingCost: 0,
        totalAmount: order.totalAmount,

        shippingAddress: {
          address: order.shippingAddress,
          phone: order.phoneNumber,
        },

        paymentProvider: order.razorpayOrderId
          ? "razorpay"
          : "cod",

        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.paymentId,

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// GET PENDING ORDERS
exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: "Pending",
    })
      .populate("user")
      .populate("products.product");

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET DELIVERED ORDERS
exports.getDeliveredOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: "Delivered",
    })
      .populate("user")
      .populate("products.product");

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CANCEL ORDER
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.orderStatus === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivered orders cannot be cancelled",
      });
    }

    order.orderStatus = "Cancelled";

    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: "Cancelled",
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SAVE PAYMENT REFERENCE
exports.savePaymentReference = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        {
          paymentReference:
            req.body.paymentReference,
        },
        {
          new: true,
        }
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Payment reference updated successfully",
      data: order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// FILTER ORDERS BY DATE
exports.filterOrdersByDate = async (
  req,
  res
) => {
  try {
    const {
      startDate,
      endDate,
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Start date and end date are required",
      });
    }

    const orders = await Order.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate("user")
      .populate("products.product");

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET REVENUE
exports.getRevenue = async (req, res) => {
  try {
    const orders = await Order.find({
      paymentStatus: "Paid",
    });

    const revenue = orders.reduce(
      (total, order) =>
        total + order.totalAmount,
      0
    );

    return res.status(200).json({
      success: true,
      revenue,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const { razorpayOrderId } = req.body;

    if (!razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay Order ID is required",
      });
    }

    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Remove only purchased products from cart
    const purchasedProductIds = order.products.map((item) =>
      item.product
    );

    await Cart.updateOne(
      { userId: order.user },
      {
        $pull: {
          products: {
            productId: { $in: purchasedProductIds },
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Order completed and cart updated successfully",
    });

  } catch (error) {
    console.error("Complete Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};