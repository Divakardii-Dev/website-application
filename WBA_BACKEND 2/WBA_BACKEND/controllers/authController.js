const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const { sendEmailOTP, sendSmsOTP } = require("../services/otpService");
const nodemailer = require("nodemailer");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const Project = require("../models/Project");//ec1

const PASSWORD_REQUIREMENT_TEXT =
  "Password must be 8-60 characters and include uppercase, lowercase, number, and symbol.";

// Helper function to dispatch OTP via Email or SMS
async function dispatchOtp(target, otpCode) {
  const isEmail = /^[^\s@]+@[^\s@]+\.(com|in)$/i.test(target);
  if (isEmail) {
    await sendEmailOTP(target, otpCode);
  } else {
    await sendSmsOTP(target, otpCode);
  }
}

// REGISTER
exports.register = async (req, res) => {
  try {
    const rawName = req.body.name || "";
    const trimmedName = rawName.trim();

    // Reject multiple consecutive spaces
    if (/\s{2,}/.test(trimmedName)) {
      return res.status(400).json({
        message: "Multiple spaces are not allowed in name",
      });
    }

    const name = trimmedName;
    const email = req.body.email?.trim().toLowerCase() || "";
    const mobile = req.body.mobile?.trim() || "";

    // Mobile formatting
    const formattedMobile = mobile.trim();
    const mobileDigits = formattedMobile.replace(/\D/g, "");

    const password = req.body.password || "";
    const confirmPassword = req.body.confirmPassword || "";

    // =========================
    // EMPTY FIELD VALIDATION
    // =========================
    if (
      !name ||
      !email ||
      !formattedMobile ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // =========================
    // NAME VALIDATION
    // =========================
    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters",
      });
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({
        message: "Name must contain only letters",
      });
    }

    // =========================
    // EMAIL VALIDATION
    // =========================
    const emailPattern = /^[^\s@]+@[^\s@]+\.(com|in)$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        message: "Enter valid email",
      });
    }

    const allowedDomains = [
      "gmail.com",
      "yahoo.com",
      "yahoo.in",
      "outlook.com",
      "thestackly.com",
    ];

    const domain = email.split("@")[1];

    if (!allowedDomains.includes(domain)) {
      return res.status(400).json({
        message:
          "Only Gmail, Yahoo, Outlook, Stackly emails are allowed",
      });
    }

    // =========================
    // MOBILE VALIDATION
    // =========================
    if (!/^\+\d{6,15}$/.test(formattedMobile)) {
      return res.status(400).json({
        message: "Enter valid mobile number",
      });
    }

    const digitsOnly = formattedMobile.replace(/\D/g, "");

    if (/^(\d)\1+$/.test(digitsOnly)) {
      return res.status(400).json({
        message: "Enter valid mobile number",
      });
    }

    const repeatedPairPattern = /^(\d{2})\1{4}$/;

    if (repeatedPairPattern.test(formattedMobile)) {
      return res.status(400).json({
        message: "Pair of Numbers Not Allowed",
      });
    }

    if (/^(\d)\1{9}$/.test(formattedMobile)) {
      return res.status(400).json({
        message: "Same numbers not allowed",
      });
    }

    // =========================
    // PASSWORD VALIDATION
    // =========================
    if (/\s/.test(password)) {
      return res.status(400).json({
        message: "Password should not contain spaces",
      });
    }

    if (/\s/.test(confirmPassword)) {
      return res.status(400).json({
        message: "Confirm Password should not contain spaces",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const passwordPattern =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

    if (!passwordPattern.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain 8 characters, uppercase, lowercase, number and special character",
      });
    }

    // =========================
    // CHECK EXISTING USER
    // =========================
    const existingUser = await User.findOne({
      $or: [
        // Primary email
        { email },

        // Primary mobile
        { mobile: formattedMobile },

        // Alternate email
        { alternates: email },

        // Alternate mobile
        { alternates: formattedMobile },
      ],
    });

    if (existingUser) {
      // Primary email already exists
      if (existingUser.email === email) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      // Primary mobile already exists
      if (existingUser.mobile === formattedMobile) {
        return res.status(400).json({
          message: "Mobile number already exists",
        });
      }

      // Alternate email already exists
      if (
        Array.isArray(existingUser.alternates) &&
        existingUser.alternates.some(
          (alternate) =>
            alternate.toLowerCase() === email.toLowerCase()
        )
      ) {
        return res.status(400).json({
          message: "Email already exists as an alternate email",
        });
      }

      // Alternate mobile already exists
      if (
        Array.isArray(existingUser.alternates) &&
        existingUser.alternates.includes(formattedMobile)
      ) {
        return res.status(400).json({
          message: "Mobile number already exists as an alternate number",
        });
      }
    }
    // =========================
    // HASH PASSWORD
    // =========================
    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================
    // CREATE USER
    // =========================
    await User.create({
      name,
      email,
      mobile: formattedMobile,
      password: hashedPassword,
      plan: "Free",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//------------ LOGIN-----------------
exports.login = async (req, res) => {
  try {
    const email = req.body.email;
    const mobile = req.body.mobile;
    const password = req.body.password;
 
    if (!password || (!email && !mobile)) {
      return res.status(400).json({
        message: "Email or mobile and password are required"
      });
    }
 
    let user;
    let userType = "primary";
 
    // ================= PRIMARY LOGIN =================
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
 
      const emailRegex =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|in|org|net|edu)$$/i;
 
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          field: "email",
          message: "Invalid email id"
        });
      }
 
      user = await User.findOne({
        email: cleanEmail
      });
 
    } else if (mobile) {
        const cleanMobile = mobile.trim();
 
        if (!/^\+\d{6,15}$/.test(cleanMobile)) {
          return res.status(400).json({
            field: "mobile",
            message: "Enter mobile number with country code"  //country code validation must
          });
        }
      
        user = await User.findOne({
          mobile: cleanMobile
        });
      }
  // ================= ALTERNATE LOGIN =================
  if (!user) {
    const inputVal = email
      ? email.trim().toLowerCase()
      : mobile.trim();
 
    const altUser = await User.findOne({
      alternates: inputVal
    });
 
    if (altUser) {
      user = altUser;
      userType = "alternate";
    }
  }
 
  // ================= USER CHECK =================
  if (!user) {
    return res.status(400).json({
      field: email ? "email" : "mobile",
      message: email
        ? "Email not registered"
        : "Mobile number not registered"
    });
  }
 
  // ================= PASSWORD CHECK =================
  if (!password.trim()) {
    return res.status(400).json({
      field: "password",
      message: "Password is required"
    });
  }
 
  const isMatch = await bcrypt.compare(
    password,
    user.password
  );
 
  if (!isMatch) {
    return res.status(400).json({
      field: "password",
      message: "Incorrect password"
    });
  }
 
    // ================= WORKSPACE =================

    const workspace = await Project.findOne({
      userId: user._id
    }).sort({ createdAt: -1 });

    // ================= TOKEN =================
    const token = jwt.sign(
      {
        userId: user._id,
        workspaceId: workspace
          ? workspace._id.toString()
          : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ================= RESPONSE =================
    return res.json({
      success: true,
      message: "Login successful",
      token,
      userType,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },

      workspaceId: workspace
        ? workspace._id.toString()
        : null,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

//----------------- FORGOT PASSWORD -----------------
exports.forgotPassword = async (req, res) => {
  try {
    const { input, isChange, primaryUser } = req.body;

    let inputVal = String(input || "").trim();

    let primaryVal = "";
    let isPrimaryEmail = false;
    let isPrimaryMobile = false;
    let primaryUserDoc = null;

    // CHANGE MODE - Identify primary user first
    if (isChange) {
      if (!primaryUser) {
        return res.status(400).json({
          message: "Primary user is required",
        });
      }

      primaryVal = String(primaryUser).trim();

      // Check whether primary user is email
      isPrimaryEmail = /^[^\s@]+@[^\s@]+$/.test(primaryVal);

      // If not email, validate as mobile
      if (!isPrimaryEmail) {
        const primaryPhone = parsePhoneNumberFromString(
          primaryVal.replace(/\s+/g, "")
        );

        if (!primaryPhone || !primaryPhone.isValid()) {
          return res.status(400).json({
            message: "Enter a valid mobile number",
          });
        }

        primaryVal = primaryPhone.number;
        isPrimaryMobile = true;
      }

      // Check if primary user is actually an alternate
      const alternateOwner = await User.findOne({
        alternates: isPrimaryEmail
          ? primaryVal.toLowerCase()
          : primaryVal,
      });

      if (alternateOwner) {
        return res.status(400).json({
          message: "Alternates may not allow alternate",
        });
      }

      // Find primary user
      if (isPrimaryEmail) {
        primaryUserDoc = await User.findOne({
          email: primaryVal.toLowerCase(),
        });
      } else {
        primaryUserDoc = await User.findOne({
          mobile: primaryVal,
        });
      }

      if (!primaryUserDoc) {
        return res.status(400).json({
          message: "Primary user not found",
        });
      }
    }

    // Empty input validation
    if (!inputVal) {
      let message = "Enter an Email or mobile number";

      if (isChange) {
        if (isPrimaryEmail) {
          message = "Enter an Alternative email address";
        } else if (isPrimaryMobile) {
          message = "Enter an Alternative mobile number";
        }
      }

      return res.status(400).json({
        message,
      });
    }
    // If input contains @, treat it as an email input
    const looksLikeEmail = inputVal.includes("@");

    let isEmail = false;
    let isMobile = false;

    // EMAIL Validation
    if (looksLikeEmail) {
      inputVal = inputVal.toLowerCase();

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(inputVal)) {
        return res.status(400).json({
          field: "email",
          message: "Enter a valid email address",
        });
      }

      // Primary Mobile → Alternate must be Mobile
      if (isChange && isPrimaryMobile) {
        return res.status(400).json({
          message:
            "Primary user is mobile, alternate must be mobile only",
        });
      }

      const allowedDomains = [
        "gmail.com",
        "yahoo.in",
        "yahoo.com",
        "outlook.com",
        "thestackly.com",
      ];

      const emailDomain = inputVal
        .split("@")[1]
        ?.toLowerCase();

      if (!allowedDomains.includes(emailDomain)) {
        return res.status(400).json({
          field: "email",
          message: "Enter a valid email address",
        });
      }

      isEmail = true;
    }
    // MOBILE validation - COUNTRY CODE MANDATORY
    else {
      const normalizedInput = inputVal.replace(/\s+/g, "");

      // Country code is mandatory
      if (!/^\+\d{6,15}$/.test(normalizedInput)) {
        return res.status(400).json({
          field: "mobile",
          message: "Enter mobile number with country code",
        });
      }

      // Validate mobile number
      const phone = parsePhoneNumberFromString(normalizedInput);

      if (!phone || !phone.isValid()) {
        return res.status(400).json({
          field: "mobile",
          message: "Enter a valid mobile number",
        });
      }

      inputVal = phone.number; // Store in E.164 format
      isMobile = true;

      // Primary Email → Alternate must be Email
      if (isChange && isPrimaryEmail) {
        return res.status(400).json({
          message:
            "Primary user is email, alternate must be email only",
        });
      }
    }
    // =====================================================
    // CHANGE ALTERNATE FLOW
    // =====================================================
    if (isChange) {
      const alternates = Array.isArray(primaryUserDoc.alternates)
        ? primaryUserDoc.alternates
        : [];

      const emailList = alternates.filter((x) =>
        /^[^\s@]+@[^\s@]+\.(com|in)$/i.test(x)
      );

      const mobileList = alternates.filter((x) =>
        /^\+\d{6,15}$/.test(x)
      );

      // Type Validation
      if (isPrimaryEmail && !isEmail) {
        return res.status(400).json({
          message:
            "Primary user is email, alternate must be email only",
        });
      }

      if (isPrimaryMobile && !isMobile) {
        return res.status(400).json({
          message:
            "Primary user is mobile, alternate must be mobile only",
        });
      }

      // Cannot use own primary cridentials
      const isSameMobile =
        inputVal === primaryUserDoc.mobile;

      const isSameEmail =
        inputVal.toLowerCase() ===
        (primaryUserDoc.email || "").toLowerCase();

      if (isSameEmail || isSameMobile) {
        return res.status(400).json({
          message: "Cannot use primary credentials",
        });
      }

      // Cannot use someone else's primary as Alternate
      const primaryExists = await User.findOne({
        _id: { $ne: primaryUserDoc._id },
        $or: [
          { email: inputVal.toLowerCase() },
          { mobile: inputVal },
        ],
      });

      if (primaryExists) {
        return res.status(400).json({
          message:
            "Cannot use someone's primary as alternate",
        });
      }

      // Duplicate E-mail alternate check
      if (
        isPrimaryEmail &&
        emailList
          .map((x) => x.toLowerCase())
          .includes(inputVal.toLowerCase())
      ) {
        return res.status(400).json({
          message: "Already added as alternate",
        });
      }
      // Duplicate Mobile alternate check
      if (
        isPrimaryMobile &&
        mobileList.includes(inputVal)
      ) {
        return res.status(400).json({
          message: "Already added as alternate",
        });
      }

      // Check if alternate is already used by another user
      const existing = await User.findOne({
        _id: { $ne: primaryUserDoc._id },
        alternates: inputVal,
      });

      if (existing) {
        return res.status(400).json({
          message: "Already used as alternate",
        });
      }

      // Maximum 2 E-mail alternates
      if (
        isPrimaryEmail &&
        emailList.length >= 2
      ) {
        return res.status(400).json({
          message:
            "Maximum 2 email alternates allowed",
        });
      }

      // Maximum 2 E-mail alternates
      if (
        isPrimaryMobile &&
        mobileList.length >= 2
      ) {
        return res.status(400).json({
          message:
            "Maximum 2 mobile number alternates allowed",
        });
      }

      // Generate OTP for Alternate
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
 
      console.log("Your OTP is:", otp);
 
      primaryUserDoc.pendingAlternate = inputVal;
      primaryUserDoc.otp = otp;
      primaryUserDoc.otpExpiry =Date.now() + 60 * 1000;
      primaryUserDoc.otpAttempts = 0;
 
      await primaryUserDoc.save();
 
      // DISPATCH OTP VIA EMAIL OR SMS
      await dispatchOtp(inputVal, otp);
 
      return res.json({
        message: "OTP sent successfully",
        // REMOVED 'otp' to prevent security leak to client
        moveToVerify: true,
        pendingAlternate: inputVal,
      });
    }
 
    // =====================================================
    // NORMAL FORGOT PASSWORD FLOW
    // =====================================================

    const user = await User.findOne({
      $or: [
        // Primary Email
        {
          email: inputVal.toLowerCase(),
        },

        // Primary Mobile
        {
          mobile: inputVal,
        },

        // Alternate Email
        {
          alternates: inputVal.toLowerCase(),
        },

        // Alternate Mobile
        {
          alternates: inputVal,
        },
      ],
    });

    if (!user) {
      return res.status(400).json({
        message: "User not Registered",
      });
    }

   //Generate OTP (Primary Account)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
 
    console.log("Your OTP is:", otp);
 
    user.otp = otp;
    user.otpExpiry = Date.now() + 60 * 1000;
    user.otpAttempts = 0;
 
    await user.save();
 
    // DISPATCH OTP VIA EMAIL OR SMS
    await dispatchOtp(inputVal, otp);
 
    return res.json({
      message: "OTP sent successfully",
      // REMOVED 'otp' to prevent security leak to client
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );
 
    return res.status(500).json({
      message: "Server error",
    });
  }
};
 
//----------------- CHECK OTP PREVIEW -----------------
exports.checkOtpPreview = async (req, res) => {
  try {
    const { input, otp } = req.body;
 
    if (!input || !otp) {
      return res.status(400).json({
        valid: false,
      });
    }
 
    let inputVal = String(input || "").trim();
 
    const isEmail =
      /^[^\s@]+@[^\s@]+\.(com|in)$/i.test(inputVal);
 
    if (isEmail) {
        inputVal = inputVal.toLowerCase();
    } else {
        const normalized = inputVal.replace(/\s+/g, "");
 
        const phone =
          parsePhoneNumberFromString(normalized);
 
        if (!phone || !phone.isValid()) {
            return res.json({
                valid: false,
            });
        }
 
        inputVal = phone.number; // E.164
    }
 
    const user = await User.findOne({
        $or: [
            { email: inputVal },
            { mobile: inputVal },
            { alternates: inputVal },
            { pendingAlternate: inputVal },
        ],
    });
 
    if (!user) {
      return res.json({
        valid: false,
      });
    }
 
    const isExpired =
      !user.otpExpiry || Date.now() > user.otpExpiry;
 
    if (isExpired) {
      return res.json({
        valid: false,
      });
    }
 
    return res.json({
      valid: user.otp === otp,
    });
  } catch (err) {
    console.error(err);
 
    return res.status(500).json({
      valid: false,
    });
  }
};
//----------------- VERIFY OTP BY EMAIL -----------------
const MAX_ATTEMPTS = 3;
const OTP_EXPIRY_TIME = 60 * 1000;
exports.verifyOtpByEmail = async (req, res) => {
  try {
    let { email, otp, action } = req.body;
    email = String(email).toLowerCase().trim();
    const user = await User.findOne({
      $or: [
        { email },
        { alternates: email },
        { pendingAlternate: email },
      ],
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // RESEND OTP 
    if (action === "resend") {
      const newOtp = Math.floor(
        1000 + Math.random() * 9000
      ).toString();
      user.otp = newOtp;
      user.otpExpiry = Date.now() + OTP_EXPIRY_TIME;
      user.otpAttempts = 0;
      await user.save();
      console.log(` Your Resend OTP is: ${newOtp}`);
 
      // SEND VIA MAILTRAP / EMAIL SERVICE
      await sendEmailOTP(email, newOtp);
      return res.json({
        message: "OTP resent successfully",
        // REMOVED 'otp: newOtp' to prevent security leak to client
      });
    }
    // VERIFY OTP
    if (!otp) {
      return res.status(400).json({
        message: "Please enter the complete 4-digit code.",
      });
    }
    const isExpired =
      !user.otpExpiry || Date.now() > user.otpExpiry;
    if (isExpired) {
      user.otp = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({
        message: "OTP expired. Please Resend code.",
      });
    }
    if (user.otp !== otp) {
      user.otpAttempts += 1;
      const attemptsLeft = MAX_ATTEMPTS - user.otpAttempts;
      await user.save();
      if (attemptsLeft <= 0) {
        return res.status(400).json({
          message: "Maximum attempts reached.",
          attemptsLeft: 0,
          redirectToForgot: true,
          redirectDelay: 3000,
        });
      }
      return res.status(400).json({
        message: "Invalid OTP",
        attemptsLeft,
      });
    }
    // SUCCESS
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );
    return res.json({
      message: "OTP verified successfully",
      token,
    });
  } catch (error) {
    console.error("OTP VERIFY ERROR:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
//----------------- VERIFY OTP BY MOBILE -----------------
exports.verifyOtpByMobile = async (req, res) => {
  try {
    let { mobile, otp, action } = req.body;
    mobile = String(mobile).trim();
 
    const user = await User.findOne({
      $or: [
        { mobile },
        { alternates: mobile },
        { pendingAlternate: mobile },
      ],
    });
 
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // RESEND OTP
    if (action === "resend") {
      const newOtp = Math.floor(
        1000 + Math.random() * 9000
      ).toString();
      user.otp = newOtp;
      user.otpExpiry = Date.now() + OTP_EXPIRY_TIME;
      user.otpAttempts = 0;
      await user.save();
      console.log(`Your Resend OTP is: ${newOtp}`);
 
      // SEND VIA SMS SERVICE
      await sendSmsOTP(mobile, newOtp);
      return res.json({
        message: "OTP resent successfully",
        // REMOVED 'otp: newOtp' to prevent security leak to client
      });
    }
    // VERIFY OTP
    if (!otp) {
      return res.status(400).json({
        message: "Please enter the complete 4-digit code.",
      });
    }
    const isExpired =
      !user.otpExpiry || Date.now() > user.otpExpiry;
    if (isExpired) {
      user.otp = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({
        message: "OTP expired. Please Resend code.",
      });
    }
    if (user.otp !== otp) {
      user.otpAttempts += 1;
      const attemptsLeft = MAX_ATTEMPTS - user.otpAttempts;
      await user.save();
      if (attemptsLeft <= 0) {
        return res.status(400).json({
          message: "Maximum attempts reached.",
          attemptsLeft: 0,
          redirectToForgot: true,
          redirectDelay: 3000,
        });
      }
      return res.status(400).json({
        message: "Invalid OTP",
        attemptsLeft,
      });
    }
    // SUCCESS
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );
    return res.json({
      message: "OTP verified successfully",
      token,
    });
  } catch (error) {
    console.error("MOBILE OTP ERROR:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
//---------------- RESET PASSWORD ----------------
exports.resetPassword = async (req, res) => {
  try {
    let { newPassword, confirmPassword } = req.body;
 
    const authHeader = req.headers.authorization;
 
    // Token validation
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token missing or invalid format",
      });
    }
 
    const token = authHeader.split(" ")[1];
 
    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        message: "Invalid token received",
      });
    }
 
    let decoded;
 
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        const decodedToken = jwt.decode(token);
 
        if (decodedToken?.userId) {
          await User.findByIdAndUpdate(decodedToken.userId, {
            pendingAlternate: null,
          });
        }
 
        return res.status(401).json({
          message: "Session expired. Please verify OTP again.",
        });
      }
 
      return res.status(401).json({
        message: "Invalid token",
      });
    }
 
    const user = await User.findById(decoded.userId);
 
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
 
    // Password validation 
    const PASSWORD_MIN_LENGTH = 8;
    const PASSWORD_MAX_LENGTH = 60;
 
    const PASSWORD_LENGTH_ERROR =
      "Password must be 8-60 characters.";
 
    const PASSWORD_WHITESPACE_ERROR =
      "Password cannot contain spaces.";
 
    const PASSWORD_UPDATE_ERROR =
      "Cannot update password. Please follow password requirements.";
 
    // Required validation
    newPassword = String(newPassword || "").trim();
    confirmPassword = String(confirmPassword || "").trim();

    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        message: "Confirm password is required",
      });
    }

    if (/\s/.test(newPassword) || /\s/.test(confirmPassword)) {
      return res.status(400).json({
        message: PASSWORD_WHITESPACE_ERROR,
      });
    }
 
    // Match frontend validation order
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }
 
    if (
      newPassword.length < PASSWORD_MIN_LENGTH ||
      newPassword.length > PASSWORD_MAX_LENGTH
    ) {
      return res.status(400).json({
        message: PASSWORD_LENGTH_ERROR,
      });
    }
    
    // Password complexity validation
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
 
    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return res.status(400).json({
        message: PASSWORD_UPDATE_ERROR,
      });
    }
 
    // Reuse check 
    const allPasswords = [
      user.password,
      ...(user.passwordHistory || []),
    ];
 
    for (const oldPass of allPasswords) {
      const isMatch = await bcrypt.compare(
        newPassword,
        oldPass
      );
 
      if (isMatch) {
        return res.status(400).json({
          message: "Cannot use last 3 passwords",
        });
      }
    }
 
    //save password
     const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );
 
    // Build push object separately
    const pushData = {
      passwordHistory: {
        $each: [user.password],
        $slice: -3,
      },
    };
 
    // Save alternate only after password reset
    if (user.pendingAlternate) {
      pushData.alternates = user.pendingAlternate.trim();
    }
 
    const updateData = {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
      otpAttempts: 0,
      pendingAlternate: null,
      $push: pushData,
    };
 
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    );
 
    console.log(
      "Saved alternates:",
      updatedUser.alternates
    );
    console.log("Password Updated Successfully");
 
    return res.json({
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.error("RESET ERROR:", err);
 
    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.getProfile = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user.userId
      ).select("-password");
 
    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }
 
    return res.json({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      avatar: user.avatar || "",
      plan: user.plan || "Free",
    });    
  } catch (error) {
    return res.status(500).json({
      message:
        error.message,
    });
  }
};
 
exports.updatePlan = async (
  req,
  res
) => {
  try {
    const { plan } =
      req.body;

    const user =
      await User.findById(
        req.user.userId
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    user.plan = plan;

    await user.save();

    return res.json({
      success: true,
      plan: user.plan,
    });

  } catch (error) {
    return res.status(500).json({
      message:
        error.message,
    });
  }
};

exports.updateProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      mobile,
      address,
      avatar,
    } = req.body;
 
    const user =
      await User.findById(
        req.user.userId
      );
 
    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }
 
    if (name) {
      user.name = name.trim();
    }
 
    if (email) {
      user.email = email.trim().toLowerCase();
    }
 
    if (mobile) {
      user.mobile = mobile.trim();
    }
 
    if (address !== undefined) {
    user.address = address.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }
    
    await user.save();
 
    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      user,
    });
 
  } catch (error) {
    return res.status(500).json({
      message:
        error.message,
    });
  }
};
 