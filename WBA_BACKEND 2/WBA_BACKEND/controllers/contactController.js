const Contact = require("../models/Contact");

// Create Contact
exports.createContact = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const contact = await Contact.create({
      firstName,
      lastName,
      email,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Contact submitted successfully",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};