// Middleware to verify admin role
const User = require("../models/user");

module.exports = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Get user from database to check role
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        // Attach user to request for consistency
        req.user = { id: user._id, role: user.role };
        next();
    } catch (err) {
        console.error("Admin middleware error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
