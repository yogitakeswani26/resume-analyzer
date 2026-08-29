import mongoose, { Schema } from 'mongoose';
import { IUser } from '../../types/index.js';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    expertise: {
      type: String,
      trim: true,
      default: '',
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    invalidatedRefreshTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for performance
userSchema.index({ email: 1 });

// Remove passwordHash from JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

export const User = mongoose.model<IUser>('User', userSchema);
