import { Schema, model } from 'mongoose';
import { ITransaction } from '../interfaces/transaction.interface';

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required.'],
      enum: ['DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'PRIZE_PAYOUT'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required.'],
      min: [1, 'Transaction amount must be at least 1 BDT.'],
    },
    status: {
      type: String,
      required: [true, 'Transaction status is required.'],
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    gateway: {
      type: String,
      required: [true, 'Payment gateway is required.'],
      enum: ['BKASH', 'NAGAD', 'ROCKET'],
      uppercase: true,
    },
    txnId: {
      type: String,
      required: [true, 'Transaction ID reference is required.'],
      trim: true,
      uppercase: true, // Forces all checks to match consistently case-insensitive
    },
    moderatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatorNotes: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Prevents double submission replays on any specific gateway
transactionSchema.index({ txnId: 1, gateway: 1 }, { unique: true });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
