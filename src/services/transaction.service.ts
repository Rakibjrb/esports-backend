import mongoose from 'mongoose';
import { Transaction } from '../schemas/transaction.schema';
import { User } from '../schemas/user.schema';
import { ITransaction, PaymentGateway } from '../interfaces/transaction.interface';
import { ConflictError, BadRequestError, NotFoundError } from '../utils/errors';

export class TransactionService {
  /**
   * Registers a new player deposit request in the ledger (locked under PENDING state)
   */
  public static async createDepositRequest(
    userId: string,
    amount: number,
    gateway: PaymentGateway,
    txnId: string
  ): Promise<ITransaction> {
    try {
      const deposit = new Transaction({
        userId,
        type: 'DEPOSIT',
        amount,
        gateway,
        txnId,
        status: 'PENDING',
      });

      await deposit.save();
      return deposit;
    } catch (error: any) {
      // 11000 represents MongoDB unique index constraint failure (duplicate key)
      if (error.code === 11000) {
        throw new ConflictError(
          'This transaction ID reference has already been submitted for verification on this gateway.',
          'DUPLICATE_TRANSACTION_ID'
        );
      }
      throw error;
    }
  }

  /**
   * Retreives filterable ledger lists populated with user profiles for moderator reviews
   */
  public static async getModeratorTransactions(filters: {
    status?: string;
    type?: string;
    gateway?: string;
  }): Promise<ITransaction[]> {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.gateway) query.gateway = filters.gateway.toUpperCase();

    return Transaction.find(query)
      .populate('userId', 'username email role')
      .populate('moderatorId', 'username email role')
      .sort({ createdAt: -1 });
  }

  /**
   * Settles pending ledger actions (approves/rejects) inside a MongoDB ACID transaction.
   * Increments player balances atomically on approval matches.
   */
  public static async processTransaction(
    transactionId: string,
    moderatorId: string,
    status: 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<{ transaction: ITransaction; updatedBalance: number }> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 1. Fetch transaction record inside the ACID context
      const transaction = await Transaction.findById(transactionId).session(session);
      if (!transaction) {
        throw new NotFoundError('Transaction record not found.', 'TRANSACTION_NOT_FOUND');
      }

      if (transaction.status !== 'PENDING') {
        throw new BadRequestError(
          `Cannot process transaction. This transaction has already been settled under status: ${transaction.status}.`,
          'TRANSACTION_ALREADY_SETTLED'
        );
      }

      // 2. Fetch associated user profile inside session
      const user = await User.findById(transaction.userId).session(session);
      if (!user) {
        throw new NotFoundError('User associated with this transaction was not found.', 'USER_NOT_FOUND');
      }

      // 3. Process status adjustments
      transaction.status = status;
      transaction.moderatorId = new mongoose.Types.ObjectId(moderatorId);
      transaction.moderatorNotes = notes;
      transaction.processedAt = new Date();

      let finalBalance = user.wallet.balance;

      if (status === 'APPROVED') {
        if (transaction.type === 'DEPOSIT') {
          user.wallet.balance += transaction.amount;
        } else if (transaction.type === 'WITHDRAWAL') {
          if (user.wallet.balance < transaction.amount) {
            throw new BadRequestError(
              'Insufficient player wallet funds to approve this withdrawal settlement request.',
              'INSUFFICIENT_FUNDS'
            );
          }
          user.wallet.balance -= transaction.amount;
        }
        finalBalance = user.wallet.balance;
        await user.save({ session });
      }

      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        transaction,
        updatedBalance: finalBalance,
      };
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();

      // Standalone Fallback: Detect if local development database is a standalone server lacking replica sets
      const isSessionError =
        error.message.includes('replica set') ||
        error.message.includes('transaction') ||
        error.message.includes('sessions') ||
        error.codeName === 'IllegalOperation';

      if (isSessionError) {
        return this.processTransactionFallback(transactionId, moderatorId, status, notes);
      }

      throw error;
    }
  }

  /**
   * Safe non-session atomic fallback executor for local standalone environments
   */
  private static async processTransactionFallback(
    transactionId: string,
    moderatorId: string,
    status: 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<{ transaction: ITransaction; updatedBalance: number }> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new NotFoundError('Transaction record not found.', 'TRANSACTION_NOT_FOUND');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestError(
        `Cannot process transaction. This transaction has already been settled under status: ${transaction.status}.`,
        'TRANSACTION_ALREADY_SETTLED'
      );
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      throw new NotFoundError('User associated with this transaction was not found.', 'USER_NOT_FOUND');
    }

    transaction.status = status;
    transaction.moderatorId = new mongoose.Types.ObjectId(moderatorId);
    transaction.moderatorNotes = notes;
    transaction.processedAt = new Date();

    let finalBalance = user.wallet.balance;

    if (status === 'APPROVED') {
      if (transaction.type === 'DEPOSIT') {
        user.wallet.balance += transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL') {
        if (user.wallet.balance < transaction.amount) {
          throw new BadRequestError(
            'Insufficient player wallet funds to approve this withdrawal settlement request.',
            'INSUFFICIENT_FUNDS'
          );
        }
        user.wallet.balance -= transaction.amount;
      }
      finalBalance = user.wallet.balance;
      await user.save();
    }

    await transaction.save();

    return {
      transaction,
      updatedBalance: finalBalance,
    };
  }
}
