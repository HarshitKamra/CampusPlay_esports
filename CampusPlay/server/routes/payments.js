const router = require("express").Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  createPayment,
  getPaymentStatus,
  getTournamentPayments,
  confirmPayment,
  rejectPayment,
  submitTransactionId,
} = require("../controllers/paymentController");

router.post("/create", auth, createPayment);
router.get("/status/:tournamentId", auth, getPaymentStatus);
router.post("/submit-transaction/:paymentId", auth, submitTransactionId);
router.get("/tournament/:tournamentId", auth, admin, getTournamentPayments);
router.post("/confirm/:paymentId", auth, admin, confirmPayment);
router.post("/reject/:paymentId", auth, admin, rejectPayment);

module.exports = router;










