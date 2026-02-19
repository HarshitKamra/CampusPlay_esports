const router = require("express").Router();
const { register, login, me, getUserCount, createAdmin, googleSignIn } = require("../controllers/authController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.post("/register", register);
router.post("/login", login);
router.post("/google-signin", googleSignIn);
router.get("/me", auth, me);
router.get("/count", [auth, admin], getUserCount);
router.post("/create-admin", [auth, admin], createAdmin);

module.exports = router;
