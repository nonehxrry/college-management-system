const express = require("express");
const router = express.Router();
const { login, refreshToken, logout, forgotPassword, resetPassword, getMe, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validateLogin } = require("../middleware/validationMiddleware");

router.post("/login", validateLogin, login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

router.use(protect);
router.post("/logout", logout);
router.get("/me", getMe);
router.put("/change-password", changePassword);

module.exports = router;