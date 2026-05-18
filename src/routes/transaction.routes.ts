import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateUser } from '../middlewares/auth.middleware';
import { depositValidator } from '../validators/transaction.validator';

const router = Router();

// 1. Player Wallet Deposit Ingestion
router.post(
  '/wallet/deposit',
  authenticateUser,
  depositValidator,
  validateRequest,
  TransactionController.requestDeposit
);

export default router;
