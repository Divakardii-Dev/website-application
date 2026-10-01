const express = require("express");
const router = express.Router();

const {
  getStoreCart,
  addStoreCartItem,
  updateStoreCartItem,
  removeStoreCartItem,
  clearStoreCart,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

// GET CART
router.get(
  "/:workspaceId",
  protect,
  getStoreCart
);

// ADD TO CART
router.post(
  "/:workspaceId/items",
  protect,
  addStoreCartItem
);

// UPDATE QUANTITY
router.put(
  "/:workspaceId/items/:itemId",
  protect,
  updateStoreCartItem
);

// REMOVE SINGLE ITEM
router.delete(
  "/:workspaceId/items/:itemId",
  protect,
  removeStoreCartItem
);

// CLEAR CART
router.delete(
  "/:workspaceId",
  protect,
  clearStoreCart
);

module.exports = router;