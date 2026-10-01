const ContactFeedback = require("../models/ContactFeedback");
const sanitizeHtml = require("sanitize-html");
const validator = require("validator");
const sendMail = require("../utils/sendMail");

exports.submitFeedback = async (req, res) => {

    try {

        const {
            firstName,
            lastName,
            email,
            message
        } = req.body;

        if (!firstName || !lastName || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "First Name, Last Name, Email and Message are required"
            });
        }
        const feedback = await ContactFeedback.create({
            firstName,
            lastName,
            email,
            message
        });

        await sendMail(
            process.env.MARKETING_EMAIL,
            "New Contact Form Submission",
            `A new contact form has been submitted.

First Name: ${firstName}
Last Name: ${lastName}
Email: ${email}
Message: ${message}`
        );

        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            data: feedback
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

exports.getAllFeedbacks = async (req, res) => {
    const feedbacks = await ContactFeedback.find();

    res.json({
        success: true,
        count: feedbacks.length,
        data: feedbacks
    });
};


exports.getFeedbackById = async (req, res) => {
    try {
        const feedback = await ContactFeedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found"
            });
        }

        res.status(200).json({
            success: true,
            data: feedback
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await ContactFeedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found"
            });
        }

        await ContactFeedback.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Feedback deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};