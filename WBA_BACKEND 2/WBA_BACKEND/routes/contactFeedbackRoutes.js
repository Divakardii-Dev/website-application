const express = require("express");
const router = express.Router();

const {
    submitFeedback,
    getAllFeedbacks,
    getFeedbackById,
    deleteFeedback
} = require("../controllers/contactFeedbackController");

router.post("/contact-feedback", submitFeedback);
router.get("/contact-feedback", getAllFeedbacks);
router.get("/contact-feedback/:id", getFeedbackById);
router.delete("/contact-feedback/:id", deleteFeedback);

module.exports = router;