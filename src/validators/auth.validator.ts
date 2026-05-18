import { body } from 'express-validator';

/**
 * Validation rules for user account registration (/api/auth/register)
 */
export const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters long.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('gameUID')
    .notEmpty()
    .withMessage('Game UID is required.')
    .isInt({ min: 1000000000 })
    .withMessage('Game UID must be a numeric value and at least 10 digits long.'),
];

/**
 * Validation rules for user account login (/api/auth/login)
 */
export const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

/**
 * Validation rules for password reset request (/api/auth/forgot-password)
 */
export const forgotPasswordValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
];

/**
 * Validation rules for setting a new password (/api/auth/reset-password)
 */
export const resetPasswordValidator = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
];
