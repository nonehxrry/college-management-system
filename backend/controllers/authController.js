const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/Student");
const Professor = require("../models/Professor");
const AuditLog = require("../models/AuditLog");
const { generateToken, generateRefreshToken, verifyRefreshToken } = require("../utils/generateToken");
const { sendEmail } = require("../utils/sendEmail");

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body; // Added role from request

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // 1. Check for user by email AND role to match the frontend tab selection
  const user = await User.findOne({ email, role }).select("+password");

  // 2. Comprehensive check: User exists, Role matches, and Password matches
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email, password, or role");
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error("Account is deactivated. Contact admin.");
  }

  const refreshToken = generateRefreshToken(user._id);

  // 3. Update last login and refresh token
  // Using updateOne is fine here as we don't want to re-hash the password
  await User.updateOne(
    { _id: user._id },
    { 
      $set: { 
        lastLogin: new Date(), 
        refreshToken: refreshToken 
      } 
    },
    { runValidators: false }
  );

  let profileData = null;
  if (user.role === "student") {
    profileData = await Student.findOne({ user: user._id })
      .populate("department", "name code")
      .populate("course", "name code")
      .populate("subjects", "name code");
  } else if (user.role === "professor") {
    profileData = await Professor.findOne({ user: user._id })
      .populate("department", "name code")
      .populate("subjects", "name code");
  }

  await AuditLog.create({
    user: user._id,
    action: "LOGIN",
    entity: "User",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken: generateToken(user._id, user.role),
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      phone: user.phone,
      lastLogin: new Date(), // Use current date for immediate response
    },
    profile: profileData,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token required");
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  const newToken = generateToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);
  await User.updateOne(
    { _id: user._id },
    { refreshToken: newRefreshToken },
    { runValidators: false }
  );

  res.status(200).json({
    success: true,
    accessToken: newToken,
    refreshToken: newRefreshToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    user: req.user._id,
    action: "LOGOUT",
    entity: "User",
    entityId: req.user._id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("No user found with this email");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background: #1a237e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      <p>This link expires in 30 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: user.email, subject: "Password Reset Request", html });
  res.status(200).json({ success: true, message: "Password reset email sent" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: "Password reset successful" });
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  let profileData = null;

  if (user.role === "student") {
    profileData = await Student.findOne({ user: user._id })
      .populate("department", "name code")
      .populate("course", "name code")
      .populate("subjects", "name code credits type semester");
  } else if (user.role === "professor") {
    profileData = await Professor.findOne({ user: user._id })
      .populate("department", "name code")
      .populate("subjects", "name code semester");
  }

  res.status(200).json({
    success: true,
    user,
    profile: profileData,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: "Password changed successfully" });
});

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, getMe, changePassword };