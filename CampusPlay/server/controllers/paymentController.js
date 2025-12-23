const crypto = require("crypto");
const Payment = require("../models/Payment");
const Tournament = require("../models/Tournament");
const User = require("../models/user");

// Initialize Razorpay only if keys are available
let Razorpay, razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  Razorpay = require("razorpay");
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("⚠️  Razorpay keys not configured. Payment features will be disabled.");
}

// Create payment order
exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ error: "Payment service is not configured. Please contact administrator." });
    }

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
      status: "completed",
    });

    if (existingPayment) {
      return res.status(400).json({ error: "Payment already completed" });
    }

    // Create Razorpay order
    const options = {
      amount: tournament.entryPrice * 100, // Convert to paise (Razorpay expects amount in smallest currency unit)
      currency: "INR",
      receipt: `tournament_${tournamentId}_${userId}_${Date.now()}`,
      notes: {
        tournamentId: tournamentId.toString(),
        userId: userId.toString(),
        tournamentTitle: tournament.title,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create payment record
    const payment = new Payment({
      tournamentId,
      userId,
      amount: tournament.entryPrice,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });

    await payment.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

// Verify payment and add participant
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Payment details are required" });
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Verify payment with Razorpay
    try {
      const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
      
      if (razorpayPayment.status !== "captured") {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({ error: "Payment not captured" });
      }
    } catch (error) {
      console.error("Razorpay verification error:", error);
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "completed";
    await payment.save();

    // Add user to tournament participants
    const tournament = await Tournament.findById(payment.tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    // Check if user already in participants
    const isParticipant = tournament.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      tournament.participants.push(userId);
      await tournament.save();
    }

    res.json({
      message: "Payment verified and registration successful",
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
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

    if (!payment) {
      return res.json({ hasPayment: false, status: null });
    }

    res.json({
      hasPayment: true,
      status: payment.status,
      amount: payment.amount,
      orderId: payment.razorpayOrderId,
    });
  } catch (error) {
    console.error("Get Payment Status Error:", error);
    res.status(500).json({ error: "Failed to get payment status" });
  }
};

