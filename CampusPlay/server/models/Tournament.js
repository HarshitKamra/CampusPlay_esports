const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tournamentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    game: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      trim: true,
    },
    banner: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    prize: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // This creates a reference to the User model
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // An array of users who have joined
      },
    ],
    registrationOpen: {
      type: Boolean,
      default: true, // Registration is open by default
    },
    isFeatured: {
      type: Boolean,
      default: false, // Not featured by default
    },
    entryPrice: {
      type: Number,
      default: 0, // 0 means free tournament
      min: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
