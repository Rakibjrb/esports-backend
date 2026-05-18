import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IWallet } from '../interfaces/user.interface';

const walletSchema = new Schema<IWallet>(
  {
    balance: {
      type: Number,
      required: true,
      default: 10, // Default BDT is 10 on account creation
      min: [0, 'Wallet balance cannot be negative.'], // Hard DB boundary rule
    },
    currency: {
      type: String,
      required: true,
      default: 'BDT', // Currency must be in BDT
      uppercase: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long.'],
      maxlength: [30, 'Username cannot exceed 30 characters.'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required.'],
      select: false, // Ensures password is excluded from standard queries by default
    },
    role: {
      type: String,
      required: true,
      enum: ['PLAYER', 'MODERATOR', 'ADMIN'],
      default: 'PLAYER',
      index: true,
    },
    wallet: {
      type: walletSchema,
      required: true,
      default: () => ({ balance: 10, currency: 'BDT' }),
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password before writing to the database
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to check password validity
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', userSchema);
export default User;
