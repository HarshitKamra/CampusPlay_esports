const express = require("express");
const router = express.Router();
const Stat = require("../models/Stat");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Get all stats
router.get("/", async (req, res) => {
    try {
        const { game, campus, playerName } = req.query;
        let query = {};
        if (game) query.game = game;
        if (campus) query.campus = campus;
        if (playerName) {
            // Search by playerName or playerId (case-insensitive)
            query.$or = [
                { playerName: { $regex: playerName, $options: 'i' } },
                { name: { $regex: playerName, $options: 'i' } },
                { playerId: { $regex: playerName, $options: 'i' } }
            ];
        }

        const stats = await Stat.find(query).sort({ kills: -1 });
        res.json(stats);
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: "Server error" });
    }
});

// Upload stats (Admin only)
router.post("/upload", [auth, admin], async (req, res) => {
    try {
        const { stats, replaceMode = 'game-campus' } = req.body;

        if (!Array.isArray(stats) || stats.length === 0) {
            return res.status(400).json({ error: "Invalid stats data" });
        }

        // Validate and clean stats data
        const validStats = stats.filter(s => s.playerId && s.playerName && s.game).map(s => ({
            playerId: String(s.playerId || '').trim(),
            playerName: String(s.playerName || '').trim(),
            campus: String(s.campus || '').trim() || undefined,
            game: String(s.game || '').trim(),
            tier: String(s.tier || '').trim() || undefined,
            matchesPlayed: parseInt(s.matchesPlayed) || 0,
            kills: parseInt(s.kills) || 0,
            deaths: parseInt(s.deaths) || 0,
            assists: parseInt(s.assists) || 0,
            damage: parseInt(s.damage) || 0,
            headshots: parseInt(s.headshots) || 0,
            wins: parseInt(s.wins) || 0,
            top10s: parseInt(s.top10s) || 0,
            revives: parseInt(s.revives) || 0,
            distanceTraveled: parseInt(s.distanceTraveled) || 0,
            weaponsUsed: String(s.weaponsUsed || '').trim() || undefined,
            rating: parseInt(s.rating) || 0,
            kdRatio: s.deaths > 0 ? (s.kills / s.deaths) : s.kills,
            winRate: s.matchesPlayed > 0 ? ((s.wins / s.matchesPlayed) * 100) : 0
        }));

        if (validStats.length === 0) {
            return res.status(400).json({ error: "No valid stats data to upload" });
        }

        // Delete existing stats based on replace mode BEFORE inserting
        if (replaceMode === 'game-campus') {
            // Delete stats that match game AND campus combinations from uploaded data
            const gameCampusPairs = [...new Set(validStats.map(s => `${s.game}|${s.campus || ''}`))];

            for (const pair of gameCampusPairs) {
                const [game, campus] = pair.split('|');
                const deleteFilter = { game: game.trim() };
                
                // Handle campus matching more robustly
                if (campus && campus.trim()) {
                    // If campus is provided, match exact campus
                    deleteFilter.campus = campus.trim();
                } else {
                    // If no campus, match records with no campus, empty campus, or null campus
                    deleteFilter.$or = [
                        { campus: { $exists: false } },
                        { campus: '' },
                        { campus: null },
                        { campus: { $in: [undefined, ''] } }
                    ];
                }
                
                const deleteResult = await Stat.deleteMany(deleteFilter);
                console.log(`Deleted ${deleteResult.deletedCount} stats for game: ${game}, campus: ${campus || 'none'}`);
            }
        } else if (replaceMode === 'all') {
            // Delete all existing stats
            const deleteResult = await Stat.deleteMany({});
            console.log(`Deleted all ${deleteResult.deletedCount} existing stats`);
        }

        // Insert new stats (use insertMany with ordered: false to continue on errors)
        // Only insert if we have valid stats
        if (validStats.length === 0) {
            return res.status(400).json({ error: "No valid stats to insert after validation" });
        }

        const result = await Stat.insertMany(validStats, { ordered: false });
        console.log(`Inserted ${result.length} new stats`);

        res.json({
            message: "Stats uploaded successfully",
            count: result.length,
            totalProcessed: validStats.length
        });
    } catch (err) {
        console.error("Upload Stats Error:", err);
        // Handle bulk write errors
        if (err.name === 'BulkWriteError') {
            return res.status(400).json({
                error: "Some stats failed to upload",
                inserted: err.result?.insertedCount || 0,
                errors: err.writeErrors?.length || 0
            });
        }
        res.status(500).json({ error: "Server error during upload" });
    }
});

// Delete a specific stat entry (Admin only)
router.delete("/:id", [auth, admin], async (req, res) => {
    try {
        const stat = await Stat.findByIdAndDelete(req.params.id);

        if (!stat) {
            return res.status(404).json({ error: "Stat not found" });
        }

        res.json({ message: "Stat deleted successfully" });
    } catch (err) {
        console.error("Delete Stat Error:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid stat ID" });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// Delete stats (Bulk/Admin only)
router.delete("/", [auth, admin], async (req, res) => {
    try {
        const { game, campus } = req.query;
        const filter = {};

        if (game) filter.game = game;
        if (campus) filter.campus = campus;

        const result = await Stat.deleteMany(filter);

        res.json({
            message: "Stats deleted successfully",
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Bulk Delete Stats Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
