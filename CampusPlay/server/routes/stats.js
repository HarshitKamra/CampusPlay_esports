const express = require("express");
const router = express.Router();
const Stat = require("../models/Stat");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Get all stats
router.get("/", async (req, res) => {
    try {
        const { game, campus } = req.query;
        let query = {};
        if (game) query.game = game;
        if (campus) query.campus = campus;

        const stats = await Stat.find(query).sort({ kills: -1 });
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Upload stats (Admin only)
router.post("/upload", [auth, admin], async (req, res) => {
    try {
        const statsData = req.body; // Expecting an array of stats objects

        if (!Array.isArray(statsData) || statsData.length === 0) {
            return res.status(400).json({ error: "Invalid data format. Expected an array of stats." });
        }

        const replaceMode = req.query.replaceMode; // 'game-campus' or 'all'

        // Validation and cleaning
        const validStats = statsData.map(stat => ({
            ...stat,
            kills: Number(stat.kills) || 0,
            matchesPlayed: Number(stat.matchesPlayed) || 0,
            wins: Number(stat.wins) || 0,
            damage: Number(stat.damage) || 0,
            kdRatio: Number(stat.kdRatio) || 0,
            winRate: Number(stat.winRate) || 0,
            tier: stat.tier || "Bronze",
            campus: stat.campus || "Unknown",
            game: stat.game || "Unknown"
        }));

        if (replaceMode === 'game-campus' && validStats.length > 0) {
            // Delete existing stats for the specific game and campus found in the upload
            // We assume the upload contains data for a consistent game/campus pair or we iterate
            const games = [...new Set(validStats.map(s => s.game))];
            const campuses = [...new Set(validStats.map(s => s.campus))];

            await Stat.deleteMany({
                game: { $in: games },
                campus: { $in: campuses }
            });
        } else if (replaceMode === 'all') {
            // Delete ALL stats
            await Stat.deleteMany({});
        }

        // Insert new stats
        // Use insertMany with ordered: false to continue inserting even if some fail (though we validated)
        const result = await Stat.insertMany(validStats, { ordered: false });

        res.json({ message: "Stats uploaded successfully", count: result.length });
    } catch (err) {
        console.error("Upload Stats Error:", err);
        res.status(500).json({ error: "Server error during upload" });
    }
});

// Delete a specific stat entry (Admin only)
router.delete("/:id", [auth, admin], async (req, res) => {
    try {
        const result = await Stat.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: "Stat entry not found" });
        }
        res.json({ message: "Stat entry deleted successfully" });
    } catch (err) {
        console.error("Delete Stat Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete stats (Bulk/Admin only)
router.delete("/", [auth, admin], async (req, res) => {
    try {
        const { game, campus, all } = req.query;
        let query = {};

        if (all === 'true') {
            // Delete everything
            query = {};
        } else {
            if (game) query.game = game;
            if (campus) query.campus = campus;

            // Prevent accidental deletion of everything if no filters provided without 'all' flag
            if (Object.keys(query).length === 0) {
                return res.status(400).json({ error: "Please specify game, campus, or all=true" });
            }
        }

        const result = await Stat.deleteMany(query);
        res.json({ message: "Stats deleted successfully", count: result.deletedCount });
    } catch (err) {
        console.error("Bulk Delete Stats Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
