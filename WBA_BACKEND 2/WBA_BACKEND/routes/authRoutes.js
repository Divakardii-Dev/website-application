const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Path to User model
 
const {
  register,
  login,
  getProfile,
  updateProfile,
  updatePlan,
  forgotPassword,
  checkOtpPreview,
  verifyOtpByEmail,
  verifyOtpByMobile,
  resetPassword,
} = require("../controllers/authController");
 
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
 
// ================= AUTH APIs =================
 
// Register & Login

router.post("/register", register);

router.post("/login", login);
 
// Forgot Password & OTP Actions

router.post("/forgot-password", forgotPassword);

router.post("/check-otp-preview", checkOtpPreview);

router.post("/verify-email", verifyOtpByEmail);

router.post("/verify-otp-email", verifyOtpByEmail); // Alias for safety

router.post("/verify-mobile", verifyOtpByMobile);

router.post("/verify-otp-mobile", verifyOtpByMobile); // Alias for safety

router.post("/reset-password", resetPassword);
 
// ================= PROTECTED APIs =================
 
router.get("/profile", protect, getProfile);

router.put("/profile", protect, updateProfile);

router.put("/update-plan", protect, updatePlan);
 
// ================= GOOGLE AUTH =================
 
router.get(

  "/google",

  passport.authenticate("google", {

    scope: ["profile", "email"],

    session: false,

    prompt: "select_account",

  })

);
 
router.get(

  "/google/callback",

  passport.authenticate("google", {

    failureRedirect: `${process.env.FRONTEND_URL}/signup`,

    session: false,

  }),

  async (req, res) => {

    const token = jwt.sign(

      {

        userId: req.user._id,

        email: req.user.email,

      },

      process.env.JWT_SECRET,

      { expiresIn: "7d" }

    );
 
    res.redirect(`${process.env.FRONTEND_URL}/google-success?token=${token}`);

  }

);
 
// =================================================================

// 2. DEV/QA TESTING API: Fetch Active OTP on AWS EC2 Server

// Accessible via: GET http://18.119.210.2:5000/api/auth/dev/get-otp?identifier=user@gmail.com

// =================================================================

router.get("/dev/get-otp", async (req, res) => {

  // Block access ONLY in true production environment

  if (process.env.NODE_ENV === "production") {

    return res.status(403).json({

      success: false,

      message: "Endpoint disabled in production environment.",

    });

  }
 
  try {

    const { identifier } = req.query;
 
    if (!identifier) {

      return res.status(400).json({

        success: false,

        message: 'Query parameter "identifier" is required.',

      });

    }
 
    const cleanInput = String(identifier).trim();
 
    // Find user across email, mobile, and alternate fields in MongoDB

    const user = await User.findOne({

      $or: [

        { email: cleanInput.toLowerCase() },

        { mobile: cleanInput },

        { alternates: cleanInput.toLowerCase() },

        { alternates: cleanInput },

        { pendingAlternate: cleanInput },

      ],

    });
 
    if (!user || !user.otp) {

      return res.status(404).json({

        success: false,

        message: "No active OTP found for this identifier.",

      });

    }
 
    const isExpired = !user.otpExpiry || Date.now() > user.otpExpiry;
 
    if (isExpired) {

      return res.status(400).json({

        success: false,

        message: "OTP for this user has expired.",

      });

    }
 
    return res.status(200).json({

      success: true,

      identifier: cleanInput,

      active_otp: user.otp,

      expiresInSeconds: Math.max(

        0,

        Math.round((user.otpExpiry - Date.now()) / 1000)

      ),

    });

  } catch (error) {

    console.error("Error fetching QA OTP on EC2:", error);

    return res.status(500).json({

      success: false,

      message: "Server error retrieving OTP.",

    });

  }

});
 
module.exports = router;
 