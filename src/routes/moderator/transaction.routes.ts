import { Router } from 'express';
import { TransactionController } from '../../controllers/transaction.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/rbac.middleware';
import { reviewTransactionValidator } from '../../validators/transaction.validator';

const router = Router();

// 1. Moderator Ledger Transactions List Query
router.get(
  '/transactions',
  authenticateUser,
  authorizeRoles(['MODERATOR', 'ADMIN']),
  TransactionController.getTransactions
);

// 2. Moderator Transaction Manual Review / Settlement Execution
router.patch(
  '/transactions/:id',
  authenticateUser,
  authorizeRoles(['MODERATOR', 'ADMIN']),
  reviewTransactionValidator,
  validateRequest,
  TransactionController.reviewTransaction
);

export default router;
