require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");//added newly
const cors = require("cors");

const app = express();


// Connect MongoDB
connectDB();


// Middleware
app.use(express.json());

// Enable CORS (Allow S3 frontend)
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);//added newly


// Test Route (optional but useful)
app.get("/", (req,res)=>{
  res.send("API is running...");
});


// 404 Handler
app.use((req,res)=>{
  res.status(404).json({
    status:"error",
    message:"404 - Route Not Found"
  });
});


// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});

