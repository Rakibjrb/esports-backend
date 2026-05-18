import { body } from 'express-validator';

/**
 * Validation rules for player deposit request (/api/wallet/deposit)
 */
export const depositValidator = [
  body('amount')
    .notEmpty()
    .withMessage('Deposit amount is required.')
    .isFloat({ min: 1 })
    .withMessage('Deposit amount must be at least 1 BDT.'),
  body('gateway')
    .trim()
    .toUpperCase()
    .isIn(['BKASH', 'NAGAD', 'ROCKET'])
    .withMessage('Gateway must be BKASH, NAGAD, or ROCKET.'),
  body('txnId')
    .trim()
    .notEmpty()
    .withMessage('Transaction ID (txnId) is required.')
    .isAlphanumeric()
    .withMessage('Transaction ID must contain only alphanumeric characters.')
    .isLength({ min: 4, max: 50 })
    .withMessage('Transaction ID must be between 4 and 50 characters long.'),
];

/**
 * Validation rules for moderator manual review updates (/api/moderator/transactions/:id)
 */
export const reviewTransactionValidator = [
  body('status')
    .trim()
    .toUpperCase()
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Review status must be either APPROVED or REJECTED.'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Moderator review reason/notes cannot exceed 500 characters.'),
];
