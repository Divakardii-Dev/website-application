const express = require("express");
const router = express.Router();

const { createContact } = require("../controllers/contactController");

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Contact Route Working",
  });
});

router.post("/", createContact);

module.exports = router;