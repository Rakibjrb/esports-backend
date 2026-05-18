import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../schemas/user.schema';
import { env } from '../config/env';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { IUser, UserRole } from '../interfaces/user.interface';
import { IJWTPayload } from '../interfaces/auth.interface';

export class AuthService {
  /**
   * Signs a short-lived access JSON Web Token for the user session
   */
  public static signToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role } as IJWTPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );
  }

  /**
   * Signs a long-lived refresh JSON Web Token
   */
  public static signRefreshToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role } as IJWTPayload,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );
  }

  /**
   * Decodes and validates session access JWT tokens
   */
  public static verifyToken(token: string): IJWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as IJWTPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Session expired or invalid token. Please log in again.', 'TOKEN_EXPIRED');
    }
  }

  /**
   * Decodes and validates long-lived refresh JWT tokens
   */
  public static verifyRefreshToken(token: string): IJWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as IJWTPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Session expired or invalid refresh token. Please log in again.', 'TOKEN_EXPIRED');
    }
  }

  /**
   * Core service to register a new user in the database
   */
  public static async registerUser(
    username: string,
    email: string,
    passwordHash: string,
    gameUID: number
  ): Promise<IUser> {
    // 1. Check if user already exists (by email or gameUID)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { gameUID }],
    });

    if (existingUser) {
      const isEmail = existingUser.email === email.toLowerCase();
      throw new ConflictError(
        isEmail ? 'An account with this email address already exists.' : 'This Game UID is already registered by another player.',
        isEmail ? 'EMAIL_ALREADY_EXISTS' : 'GAME_UID_ALREADY_EXISTS'
      );
    }

    // 2. Initialize default starting balance (10 BDT on account creation)
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      passwordHash, // This will be automatically hashed by the Mongoose userSchema pre-save hook
      gameUID,
      wallet: {
        balance: 5, // Default starting BDT is 10 on account creation
        currency: 'BDT',
      },
    });

    await newUser.save();

    // Discard passwordHash from returned mongoose entity object
    const returnedUser = newUser.toObject();
    delete (returnedUser as any).passwordHash;

    return returnedUser as unknown as IUser;
  }

  /**
   * Core service to authenticate users checking credential matches
   */
  public static async loginUser(email: string, passwordHash: string): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // 1. Fetch user matching email, explicitly selecting the passwordHash field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new BadRequestError('Invalid credentials matching this email address.', 'INVALID_CREDENTIALS');
    }

    // 2. Verify password comparison matches
    const isPasswordValid = await user.comparePassword(passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestError('Invalid credentials matching this password.', 'INVALID_CREDENTIALS');
    }

    // 3. Generate secure access & refresh tokens
    const token = this.signToken(user._id.toString(), user.role);
    const refreshToken = this.signRefreshToken(user._id.toString(), user.role);

    // 4. Save hashed refresh token to the database for maximum session security
    user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await user.save();

    // Discard sensitive properties from the returned user document
    const returnedUser = user.toObject();
    delete (returnedUser as any).passwordHash;
    delete (returnedUser as any).refreshToken;

    return {
      user: returnedUser as unknown as IUser,
      token,
      refreshToken,
    };
  }

  /**
   * Generates a secure, cryptographically random password reset token
   * and saves its SHA-256 hash in the database along with its 1-hour expiration time.
   */
  public static async generatePasswordResetToken(email: string): Promise<string> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError('No user account associated with this email address.', 'EMAIL_NOT_FOUND');
    }

    // Generate a raw cryptographically secure token (40 hex chars)
    const rawToken = crypto.randomBytes(20).toString('hex');

    // Hash the token using SHA-256 before storing it in the database for supreme security
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // Expires in exactly 1 hour

    await user.save();

    return rawToken;
  }

  /**
   * Hashes the raw incoming reset token, validates its presence and lifespan,
   * hashes the new password, updates the player credentials, and wipes the reset locks.
   */
  public static async resetPassword(token: string, newPassword: string): Promise<void> {
    // Re-hash the raw incoming token to search for the secure DB match
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new BadRequestError(
        'The password reset token is invalid, expired, or has already been used.',
        'INVALID_OR_EXPIRED_RESET_TOKEN'
      );
    }

    // Update player credentials (triggers Mongoose's pre-save auto-hashing hook)
    user.passwordHash = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
  }
}

export default AuthService;
