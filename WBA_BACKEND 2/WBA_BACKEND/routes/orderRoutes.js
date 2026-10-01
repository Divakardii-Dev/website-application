const express = require("express");
const router = express.Router();

const {
  getOrderSummary,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getPendingOrders,
  getDeliveredOrders,
  cancelOrder,
  savePaymentReference,
  filterOrdersByDate,
  getRevenue,
} = require("../controllers/orderController");

router.post("/summary", getOrderSummary); //Order Summary
router.get("/user/:userId", getUserOrders); //User Orders
// Dashboard
router.get("/pending", getPendingOrders);
router.get("/delivered", getDeliveredOrders);
router.get("/revenue", getRevenue);
router.get("/filter/date", filterOrdersByDate);

// Frontend-compatible single order routes
router.get("/order/:id", getOrderById);
router.put("/order/:id", updateOrderStatus);

router.get("/order/:id", getOrderById); //Single Order

// UPDATE ORDER
router.put("/order/:id", updateOrderStatus);
router.put("/order/:id/cancel", cancelOrder);
router.put("/order/:id/payment", savePaymentReference);

// All Orders Of a Workspace(Keep this LAST because it is dynamic)
router.get("/:workspaceId", getAllOrders);

module.exports = router;