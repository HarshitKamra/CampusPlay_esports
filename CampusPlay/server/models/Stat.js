const mongoose = require("mongoose");

const StatSchema = new mongoose.Schema({
    playerId: {
        type: String,
        required: false // CSV might not have ID, or we generate one
    },
    playerName: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    }, // Keep for backward compatibility
    campus: {
        type: String,
        trim: true,
        default: "Unknown"
    },
    game: {
        type: String,
        required: true,
        trim: true
    },
    tier: {
        type: String,
        trim: true,
        default: "Unranked"
    },
    matchesPlayed: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    kills: {
        type: Number,
        default: 0
    },
    deaths: {
        type: Number,
        default: 0
    },
    assists: {
        type: Number,
        default: 0
    },
    damage: {
        type: Number,
        default: 0
    },
    headshots: {
        type: Number,
        default: 0
    },
    top10s: {
        type: Number,
        default: 0
    },
    revives: {
        type: Number,
        default: 0
    },
    distanceTraveled: {
        type: Number,
        default: 0
    },
    weaponsUsed: {
        type: String,
        trim: true
    },
    timeSurvived: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    kdRatio: {
        type: Number,
        default: 0
    },
    winRate: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
StatSchema.index({ game: 1, campus: 1 });
StatSchema.index({ rating: -1 });

module.exports = mongoose.model("Stat", StatSchema);
