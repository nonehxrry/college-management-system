const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { 
      type: String, 
      required: true, 
      minlength: 8,
      select: false // This hides the password from normal searches
    },
    role: { type: String, enum: ["student", "professor", "admin"], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// This part hashes your password before it hits the database
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// This part compares the password you type with the hash in the DB
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);