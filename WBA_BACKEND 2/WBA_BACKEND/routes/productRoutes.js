const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getStorefrontProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

// ================================
// FRONTEND COMPATIBLE ROUTES
// ================================

// CREATE PRODUCT
// POST /api/ecommerce/product
router.post("/product", createProduct);

// GET PRODUCTS FOR DASHBOARD
// GET /api/ecommerce/products/:workspaceId
router.get("/products/:workspaceId", getStorefrontProducts);

// GET SINGLE PRODUCT
// GET /api/ecommerce/product/:id
router.get("/product/:id", getProductById);

// UPDATE PRODUCT
// PUT /api/ecommerce/product/:id
router.put("/product/:id", updateProduct);

// DELETE PRODUCT
// DELETE /api/ecommerce/product/:id
router.delete("/product/:id", deleteProduct);


// ================================
// EXISTING ROUTES
// ================================

// CREATE
router.post("/", createProduct);

// READ ALL
router.get("/", getAllProducts);

// STOREFRONT PRODUCTS
router.get("/store/:workspaceId/products", getStorefrontProducts);

// READ ONE
router.get("/:id", getProductById);

// UPDATE
router.put("/:id", updateProduct);

// DELETE
router.delete("/:id", deleteProduct);

module.exports = router;