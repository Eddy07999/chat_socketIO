const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../crypto');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// --- Encrypt sensitive fields before save ---

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  }

  if (this.isModified('email')) {
    this.email = encrypt(this.email);
  }

  if (this.isModified('displayName') && this.displayName) {
    this.displayName = encrypt(this.displayName);
  }
});

// --- Instance helpers ---

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.decryptedEmail = function () {
  try {
    return decrypt(this.email);
  } catch {
    return this.email;
  }
};

userSchema.methods.decryptedDisplayName = function () {
  if (!this.displayName) return this.username;
  try {
    return decrypt(this.displayName);
  } catch {
    return this.displayName;
  }
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.decryptedEmail(),
    displayName: this.decryptedDisplayName(),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
