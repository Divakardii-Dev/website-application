const express = require("express");

const {
  subscribeNewsletter,
} = require("../controllers/newsletterController");

const router = express.Router();

// POST /api/newsletter/subscribe
router.post("/subscribe", subscribeNewsletter);

module.exports = router;
