const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || require('dotenv').config() && process.env.MONGO_URI);
    const user = await User.findOne({ email: 'student@college.edu' }).select('+password');
    if (!user) {
      console.log('No student user found');
      return;
    }
    console.log('User found:', user.email, user.password ? 'password present' : 'no password');
    console.log('Password hash length:', user.password ? user.password.length : 'n/a');
    const valid = await user.comparePassword('Student@123');
    console.log('bcrypt compare Student@123 =>', valid);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();