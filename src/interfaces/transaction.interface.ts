import { Document, Types } from 'mongoose';

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'ENTRY_FEE' | 'PRIZE_PAYOUT';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentGateway = 'BKASH' | 'NAGAD' | 'ROCKET';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  gateway: PaymentGateway;
  txnId: string;
  moderatorId?: Types.ObjectId;
  moderatorNotes?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
