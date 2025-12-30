const Payment = require("../models/Payment");
const Tournament = require("../models/Tournament");
const User = require("../models/user");

// Create payment record (when user initiates payment)
exports.createPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tournamentId } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ error: "Tournament ID is required" });
    }

    // Get tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    // Check if tournament has entry fee
    if (!tournament.entryPrice || tournament.entryPrice <= 0) {
      return res.status(400).json({ error: "This tournament is free" });
    }

    // Check if registration is open
    if (tournament.registrationOpen === false) {
      return res.status(400).json({ error: "Registration is closed" });
    }

    // Check if user already joined
    const isParticipant = tournament.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (isParticipant) {
      return res.status(400).json({ error: "You are already registered" });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      tournamentId,
      userId,
    }).sort({ createdAt: -1 });

    if (existingPayment && existingPayment.status === "completed") {
      return res.status(400).json({ error: "Payment already completed" });
    }

    // Create or update payment record
    let payment;
    if (existingPayment && existingPayment.status === "pending") {
      payment = existingPayment;
    } else {
      payment = new Payment({
        tournamentId,
        userId,
        amount: tournament.entryPrice,
        status: "pending",
      });
      await payment.save();
    }

    res.json({
      message: "Payment record created",
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
      },
      upiId: tournament.upiId,
      tournamentTitle: tournament.title,
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({ error: "Failed to create payment record" });
  }
};

// Get user's payment status for a tournament
exports.getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tournamentId } = req.params;

    const payment = await Payment.findOne({
      tournamentId,
      userId,
    }).sort({ createdAt: -1 });

    const tournament = await Tournament.findById(tournamentId);

    if (!payment) {
      return res.json({
        hasPayment: false,
        status: null,
        upiId: tournament?.upiId || "",
        amount: tournament?.entryPrice || 0,
      });
    }

    res.json({
      hasPayment: true,
      status: payment.status,
      amount: payment.amount,
      upiId: tournament?.upiId || "",
      tournamentTitle: tournament?.title || "",
      paymentId: payment._id,
      playerTransactionId: payment.playerTransactionId || "",
    });
  } catch (error) {
    console.error("Get Payment Status Error:", error);
    res.status(500).json({ error: "Failed to get payment status" });
  }
};

// Submit transaction ID by player
exports.submitTransactionId = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { paymentId } = req.params;
    const { transactionId } = req.body;

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Verify that the payment belongs to the user
    if (payment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only submit transaction ID for your own payment" });
    }

    // Check if payment is already completed
    if (payment.status === "completed") {
      return res.status(400).json({ error: "Payment is already confirmed" });
    }

    // Update player transaction ID
    payment.playerTransactionId = transactionId.trim();
    await payment.save();

    res.json({
      message: "Transaction ID submitted successfully",
      payment: {
        id: payment._id,
        playerTransactionId: payment.playerTransactionId,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Submit Transaction ID Error:", error);
    res.status(500).json({ error: "Failed to submit transaction ID" });
  }
};

// Get all pending payments for a tournament (Admin only)
exports.getTournamentPayments = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { tournamentId } = req.params;

    const payments = await Payment.find({ tournamentId })
      .populate("userId", "name email")
      .populate("confirmedBy", "name")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error("Get Tournament Payments Error:", error);
    res.status(500).json({ error: "Failed to get tournament payments" });
  }
};

// Confirm payment (Admin only)
exports.confirmPayment = async (req, res) => {
  try {
    const adminId = req.user?.id || req.userId;
    if (!adminId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user is admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { paymentId } = req.params;
    const { transactionId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status === "completed") {
      return res.status(400).json({ error: "Payment already confirmed" });
    }

    // Update payment status
    payment.status = "completed";
    payment.transactionId = transactionId?.trim() || "";
    payment.confirmedBy = adminId;
    payment.confirmedAt = new Date();
    await payment.save();

    // Add user to tournament participants if not already added
    const tournament = await Tournament.findById(payment.tournamentId);
    if (tournament) {
      const isParticipant = tournament.participants.some(
        (p) => p.toString() === payment.userId.toString()
      );

      if (!isParticipant) {
        tournament.participants.push(payment.userId);
        await tournament.save();
      }
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate("userId", "name email")
      .populate("confirmedBy", "name");

    res.json({
      message: "Payment confirmed successfully",
      payment: populatedPayment,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
};

// Reject/Fail payment (Admin only)
exports.rejectPayment = async (req, res) => {
  try {
    const adminId = req.user?.id || req.userId;
    if (!adminId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user is admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = "failed";
    await payment.save();

    res.json({
      message: "Payment rejected",
      payment,
    });
  } catch (error) {
    console.error("Reject Payment Error:", error);
    res.status(500).json({ error: "Failed to reject payment" });
  }
};
