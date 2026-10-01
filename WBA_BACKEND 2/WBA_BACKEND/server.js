require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const path = require("path");  
const session = require("express-session");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const templateRoutes = require("./routes/templateRoutes");
const fileRoutes = require("./routes/fileRoutes");
const projectRoutes = require("./routes/projectRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const blogRoutes = require("./routes/blogRoutes");
const sitemapRoutes = require("./routes/sitemapRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const contactFeedbackRoutes = require("./routes/contactFeedbackRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const blockRoutes = require("./routes/blockRoutes"); //adding for block
//E-commerce
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");

const app = express();

// Passport Configuration
require("./config/passport");

// Session Middleware
app.use(
  session({
    secret: "googleauthsecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
// app.use(passport.session());

// Connect MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: "10mb" }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ================= ROUTES =================

// Authentication
app.use("/api/auth", authRoutes);

// Categories
app.use("/api/categories", categoryRoutes);

// Templates
app.use("/api/template", templateRoutes);

// Files
app.use("/api/files", fileRoutes);

// Projects
app.use("/api/projects", projectRoutes);

// Payments
app.use("/api/payment", paymentRoutes);
app.use("/api/razorpay", paymentRoutes);

// Subscriptions
app.use("/api/subscriptions", subscriptionRoutes);

// Checkout
app.use("/api/checkout", checkoutRoutes);

// Blog
app.use("/api/blog", blogRoutes);

// Sitemap
app.use("/api/sitemap", sitemapRoutes);

//contact 
app.use("/api/contact", contactRoutes);
app.use("/api/contact/feedback", contactFeedbackRoutes);
// Newsletter
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/upload", uploadRoutes);

//blocks
app.use("/api/blocks",blockRoutes); //added for blocks
 
//E-commerce
app.use("/api/products", productRoutes); // product routes
app.use("/api/ecommerce", productRoutes);// Storefront products
app.use("/api/cart", cartRoutes); // cart routes
app.use("/api/ecommerce/orders", orderRoutes); // order routes
app.use("/api/ecommerce", orderRoutes);

// ================= TEST ROUTES =================

// Root Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend is healthy",
  });
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "404 - Route Not Found",
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});