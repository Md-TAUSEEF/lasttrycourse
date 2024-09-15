const dotenv = require("dotenv");
dotenv.config({ path: "./Config/.env" });
const Razorpay = require("razorpay");

const User = require("../Modules/User_module");

const crypto = require("crypto"); //this is using to create the url
const Payment=require("../Modules/Payment_modules");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY ,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});



const buySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Admin cannot buy subscriptions" });
    }

    const planId = process.env.PLAN_ID || "plan_OmcfISmyCKd7OC";

    // Create subscription using Razorpay instance
    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      customer_notify: 1, // Notify customer via email/SMS
      total_count: 12,    // Number of months for subscription
    });

    // Update user subscription details
    user.subscription = {
      id: subscription.id,
      status: subscription.status,
    };

    await user.save();

    res.status(201).json({
      success: true,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error(`Error creating subscription: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to create subscription",
    });
  }
};


//<============Pyment veryfication =====================>//


//ishme hame razorpay doc se code lena hai


const paymentVerification = async (req, res) => {
  try {
    const { razorpay_payment_id,  razorpay_subscription_id, razorpay_signature } = req.body;

    // Retrieve the user based on their ID (assumed to be in req.user._id)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const subscription_id = user.subscription.id;

    // Generate the signature using Razorpay's method
    const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

    const isAuthentic = generated_signature === razorpay_signature;

    if (!isAuthentic)
      return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

    // Log all values for debugging
    console.log("Received Razorpay Signature:", razorpay_signature);
    console.log("Generated Signature:", generated_signature);
    console.log("Received Order ID:",razorpay_subscription_id);
    console.log("Received Payment ID:", razorpay_payment_id);

   
    // Log successful verification
    console.log("Payment verification successful");

    // Record the payment in the database
    await Payment.create({
      razorpay_signature,
      razorpay_payment_id,
      razorpay_subscription_id,
    });

    // Update user subscription status
    user.subscription.status = "active";
    await user.save();

    res.redirect(
      `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
    );

  } catch (error) {
    console.error("Error during payment verification:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};


//<=============get razorpay key==================>//

const GetRazorpaykey = async (req, res) => {
  try {
    res.status(200).json({ success: true, key: process.env.RAZORPAY_API_KEY });
  } catch (error) {
    console.error("Error fetching Razorpay key:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//<============Cancel Subscription =====================>>//
const CancelSubscription = async (req, res) => {
  try {
    // Find the user by their ID
    const user = await User.findById(req.user._id);

    // Get the subscription ID from the user's subscription object
    const subscriptionId = user.subscription.id;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No subscription found for the user.',
      });
    }

    // Find the subscription using the subscription ID
    const subscription = await instance.subscriptions.fetch(subscriptionId);

    // Check if the subscription is already canceled
    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already canceled.',
      });
    }

    // Cancel the subscription using the subscription ID
    await instance.subscriptions.cancel(subscriptionId);

    // Find the payment record associated with the subscription
    const payment = await Payment.findOne({
      razorpay_subscription_id: subscriptionId,
    });

    // Calculate the time elapsed since the payment was created
    const gap = Date.now() - payment.createdAt;

    // Calculate the refund window (in milliseconds) based on the environment variable
    const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;

    let refund = false;

    // Check if the current time is within the refund window
    if (refundTime > gap) {
      // Process the refund if within the refund window
      await instance.payments.refund(payment.razorpay_payment_id);
      refund = true;
    }

    // Remove the payment record from the database
    await payment.remove();

    // Clear the user's subscription ID and update the status to "inactive"
    user.subscription.id = undefined;
    user.subscription.status = "inactive"; // Update status to inactive

    // Add a flag for pending refund
    user.subscription.refundPending = refund;

    // Save the updated user data to the database
    await user.save();

    // Send a successful response with a message based on whether a refund was issued
    res.status(200).json({
      success: true,
      message: refund
        ? "Subscription canceled successfully. You will receive a refund within 7 days."
        : "Subscription canceled successfully. You will not receive a refund.",
    });
  } catch (error) {
    // Log the error and send an error response
    console.error("Error canceling subscription:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while canceling the subscription.",
      error: error.message,
    });
  }
};

module.exports = {buySubscription,paymentVerification, GetRazorpaykey,CancelSubscription};
