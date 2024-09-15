const express = require("express");
const router = express.Router();
const { authmiddleware } = require("../Middleware/Aut_middlewer");
const paymentcnt = require("../Controller/Payment_controller");

//<==============buy subscription===================>
router.get("/buysubscription", authmiddleware, paymentcnt.buySubscription);

//<===================payment verification and store in database================>//

router.post("/pymentverification",authmiddleware,paymentcnt.paymentVerification)

//<====================get razorpay key=====================>//

router.get("/razorpaykey",authmiddleware,paymentcnt. GetRazorpaykey);

//<================cancel subscription ===============>//
router.delete("/subscription/chencel",authmiddleware,paymentcnt.CancelSubscription);

module.exports = router;
