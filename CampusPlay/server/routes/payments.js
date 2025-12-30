const router = require("express").Router();
const auth = require("../middleware/auth");
const { createOrder, verifyPayment, getPaymentStatus } = require("../controllers/paymentController");

router.post("/create-order", auth, createOrder);
router.post("/verify", auth, verifyPayment);
router.get("/status/:tournamentId", auth, getPaymentStatus);

module.exports = router;



