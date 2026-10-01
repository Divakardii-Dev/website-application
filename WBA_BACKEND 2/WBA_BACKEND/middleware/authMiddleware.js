const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.header("Authorization");

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      message: "No token",
    });
  }

  try {
    // Remove "Bearer " and verify token
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    // Save decoded user data in request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(400).json({
      message: "Invalid token",
    });
  }
};

module.exports = {
  protect,
};