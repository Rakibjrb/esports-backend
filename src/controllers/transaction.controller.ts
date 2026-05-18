import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { sendResponse } from '../utils/sendResponse';

export class TransactionController {
  /**
   * Triggers a new PENDING ledger top-up request submitted by a player
   */
  public static requestDeposit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { amount, gateway, txnId } = req.body;
      const userId = req.user!.id; // Authenticated session ID reference

      const transaction = await TransactionService.createDepositRequest(
        userId,
        amount,
        gateway,
        txnId
      );

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Deposit verification request submitted successfully.',
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves filterable list queries of all transactional events in the backend system
   */
  public static getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    console.log(req.query);
    try {
      const { status, type, gateway } = req.query;

      const transactions = await TransactionService.getModeratorTransactions({
        status: status as string,
        type: type as string,
        gateway: gateway as string,
      });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Transactions ledger list retrieved successfully.',
        data: { transactions },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Evaluates player events by approving/rejecting them, atomically updating user balances
   */
  public static reviewTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params; // Transaction ID
      const { status, reason } = req.body;
      const moderatorId = req.user!.id; // Reviewer session ID reference

      const { transaction, updatedBalance } = await TransactionService.processTransaction(
        id,
        moderatorId,
        status,
        reason
      );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Transaction processing complete. Wallet status updated successfully.',
        data: {
          transaction: {
            id: transaction._id,
            userId: transaction.userId,
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status,
            txnId: transaction.txnId,
            gateway: transaction.gateway,
            moderatorNotes: transaction.moderatorNotes,
            processedAt: transaction.processedAt,
          },
          userWallet: {
            userId: transaction.userId,
            updatedBalance,
            currency: 'BDT',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
