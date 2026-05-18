import { Document } from 'mongoose';

export type UserRole = 'PLAYER' | 'MODERATOR' | 'ADMIN';

export interface IWallet {
  balance: number;
  currency: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  wallet: IWallet;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}
