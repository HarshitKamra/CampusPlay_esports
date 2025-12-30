const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "UPI", // UPI, Card, Netbanking, etc.
    },
    playerTransactionId: {
      type: String,
      trim: true,
      default: "", // Transaction ID submitted by player
    },
    transactionId: {
      type: String,
      trim: true,
      default: "", // Manual transaction ID entered by admin (for verification)
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // Admin who confirmed the payment
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
paymentSchema.index({ tournamentId: 1, userId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);










