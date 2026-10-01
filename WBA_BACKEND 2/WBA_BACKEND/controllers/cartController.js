const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// =====================================================
// GET STOREFRONT CART
// GET /api/cart/:workspaceId
// =====================================================

exports.getStoreCart = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const cart = await Cart.findOne({ userId }).populate(
      "products.productId"
    );

    // Cart doesn't exist = Empty cart
    if (!cart) {
      return res.status(200).json({
        items: [],
        total: 0,
        currency: "INR",
      });
    }

    const items = cart.products
      .filter((item) => item.productId)
      .map((item) => {
        const product = item.productId;

        return {
          _id: item._id,
          product: product,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        };
      });

    const total = items.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    return res.status(200).json({
      items,
      total,
      currency: "INR",
    });
  } catch (error) {
    console.error("GET STOREFRONT CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// ADD STOREFRONT CART ITEM
// POST /api/cart/:workspaceId/items
// =====================================================

exports.addStoreCartItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    // Check authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Validate product ID
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    // Validate quantity
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Find product from Product collection
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Optional: Check product status
    if (product.status && product.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    // Check stock
    if (product.inventory < parsedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.inventory} item(s) available in stock`,
      });
    }

    // Find user's cart
    let cart = await Cart.findOne({ userId });

    // Create new cart if not exists
    if (!cart) {
      cart = await Cart.create({
        userId,
        products: [
          {
            productId: product._id,
            quantity: parsedQuantity,
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: "Product added to cart",
        data: {
          product: product,
          quantity: parsedQuantity,
        },
      });
    }

    // Check whether product already exists
    const existingItem = cart.products.find(
      (item) =>
        item.productId &&
        item.productId.toString() === product._id.toString()
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + parsedQuantity;

      // Check total quantity against stock
      if (newQuantity > product.inventory) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.inventory} item(s) available in stock`,
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      // Add new product
      cart.products.push({
        productId: product._id,
        quantity: parsedQuantity,
      });
    }

    await cart.save();

    // Populate product details
    await cart.populate("products.productId");

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: cart,
    });

  } catch (error) {
    console.error("ADD STOREFRONT CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE STOREFRONT CART ITEM QUANTITY
// PUT /api/cart/:workspaceId/items/:itemId
// =====================================================

exports.updateStoreCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.products.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.quantity = quantity;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart item quantity updated",
    });
  } catch (error) {
    console.error("UPDATE STOREFRONT CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// REMOVE STOREFRONT CART ITEM
// DELETE /api/cart/:workspaceId/items/:itemId
// =====================================================

exports.removeStoreCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.products.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.deleteOne();

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("REMOVE STOREFRONT CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// CLEAR STOREFRONT CART
// DELETE /api/cart/:workspaceId
// =====================================================

exports.clearStoreCart = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const cart = await Cart.findOne({ userId });

    // Already empty
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty",
      });
    }

    cart.products = [];

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("CLEAR STOREFRONT CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};