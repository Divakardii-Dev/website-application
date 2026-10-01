const crypto = require("crypto");

const verifySignature = (
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
) => {
  try {
    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body.toString())
        .digest("hex");

    return (
      expectedSignature ===
      razorpay_signature
    );
  } catch (error) {
    console.log(
      "Signature Verification Error:",
      error
    );

    return false;
  }
};

module.exports = verifySignature;