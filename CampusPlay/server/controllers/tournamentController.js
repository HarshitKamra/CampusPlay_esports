const Tournament = require("../models/Tournament");

exports.create = async (req, res) => {
  try {
    const { title, game, date, banner, description, prize, time, isFeatured, entryPrice } = req.body;

    // Basic validation
    if (!title || !game || !date) {
      return res.status(400).json({ error: "Title, game, and date are required" });
    }

    // Validate title length
    if (title.trim().length < 3) {
      return res.status(400).json({ error: "Title must be at least 3 characters" });
    }

    // Validate date
    const tournamentDate = new Date(date);
    if (isNaN(tournamentDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Use req.user.id if available, otherwise fall back to req.userId
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const newTournament = new Tournament({
      title: title.trim(),
      game: game.trim(),
      date: tournamentDate,
      banner: banner?.trim() || "",
      description: description?.trim() || "",
      prize: prize?.trim() || "",
      time: time?.trim() || "",
      isFeatured: isFeatured || false,
      entryPrice: entryPrice ? parseFloat(entryPrice) : 0,
      createdBy: userId,
      participants: [userId], // Creator automatically joins
    });

    await newTournament.save();
    const populated = await Tournament.findById(newTournament._id).populate("createdBy", "name");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Tournament Error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

exports.list = async (_req, res) => {
  try {
    const list = await Tournament.find()
      .sort({ date: 1 })
      .populate("createdBy", "name")
      .populate("participants", "name email"); // Populate participants for frontend check
    res.json(list);
  } catch (err) {
    console.error("List Tournaments Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.join = async (req, res) => {
  try {
    // Use req.user.id if available, otherwise fall back to req.userId
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    if (tournament.registrationOpen === false) { // Explicit check for false
      return res.status(400).json({ error: "Registration is closed for this tournament" });
    }

    // Check if user already joined (handling ObjectId comparison)
    const isParticipant = tournament.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (isParticipant) {
      return res.status(400).json({ error: "User already joined" });
    }

    // If tournament has entry fee, check if payment is completed
    if (tournament.entryPrice > 0) {
      const Payment = require("../models/Payment");
      const payment = await Payment.findOne({
        tournamentId: tournament._id,
        userId,
        status: "completed",
      });

      if (!payment) {
        return res.status(402).json({ 
          error: "Payment required", 
          entryPrice: tournament.entryPrice,
          message: "Please complete payment to join this tournament" 
        });
      }
    }

    tournament.participants.push(userId);
    await tournament.save();
    const populated = await Tournament.findById(tournament._id)
      .populate("createdBy", "name")
      .populate("participants", "name email");
    res.json(populated);
  } catch (err) {
    console.error("Join Tournament Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid tournament ID" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { registrationOpen, isFeatured } = req.body;
    const updateData = {};
    if (registrationOpen !== undefined) updateData.registrationOpen = registrationOpen;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!tournament) return res.status(404).json({ error: "Tournament not found" });
    res.json(tournament);
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ error: err.message });
  }
};
