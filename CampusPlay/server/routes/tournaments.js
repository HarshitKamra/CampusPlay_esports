const router = require("express").Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { create, list, join, updateStatus } = require("../controllers/tournamentController");

router.get("/", list);
router.post("/", [auth, admin], create);
router.post("/:id/join", auth, join);
router.patch("/:id/status", [auth, admin], updateStatus);
// DELETE tournament (ADMIN only)
router.delete('/:id', authMiddleware, adminMiddleware, deleteTournament);

module.exports = router;
