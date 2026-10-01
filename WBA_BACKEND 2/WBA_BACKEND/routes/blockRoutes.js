const express = require("express");

const router = express.Router();

const {
  getBlocks,
  getBlocksByView,
  createBlock,
  searchBlocks,
  getBlockById,
  updateBlock,
  deleteBlock,
} = require("../controllers/blockController");

// Get All Blocks
router.get("/", getBlocks);

// Get Blocks By View
router.get("/view", getBlocksByView);

// Search Blocks
router.get("/search", searchBlocks);

// Get Block By ID
router.get("/:id", getBlockById);

// Create Block
router.post("/", createBlock);

// Update Block
router.put("/:id", updateBlock);

// Delete Block
router.delete("/:id", deleteBlock);

module.exports = router;