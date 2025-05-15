import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'pharmacist'],
    default: 'pharmacist'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  profilePicture: {
    type: String
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Fix: Check if model already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
