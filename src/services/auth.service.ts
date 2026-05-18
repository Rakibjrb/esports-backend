import jwt from 'jsonwebtoken';
import { User } from '../schemas/user.schema';
import { env } from '../config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { IUser, UserRole } from '../interfaces/user.interface';
import { IJWTPayload } from '../interfaces/auth.interface';

export class AuthService {
  /**
   * Signs a secure JSON Web Token for the user session
   */
  public static signToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role } as IJWTPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  /**
   * Decodes and validates session JWT tokens
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
   * Core service to register a new user in the database
   */
  public static async registerUser(username: string, email: string, passwordHash: string): Promise<IUser> {
    // 1. Check if user already exists (by email or username)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const isEmail = existingUser.email === email.toLowerCase();
      throw new ConflictError(
        isEmail ? 'An account with this email address already exists.' : 'This username is already taken.',
        isEmail ? 'EMAIL_ALREADY_EXISTS' : 'USERNAME_ALREADY_EXISTS'
      );
    }

    // 2. Initialize default starting balance (10 BDT on account creation)
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      passwordHash, // This will be automatically hashed by the Mongoose userSchema pre-save hook
      wallet: {
        balance: 10, // Default starting BDT is 10 on account creation
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
  public static async loginUser(email: string, passwordHash: string): Promise<{ user: IUser; token: string }> {
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

    // 3. Generate secure JWT token
    const token = this.signToken(user._id.toString(), user.role);

    // Discard passwordHash from the returned user document
    const returnedUser = user.toObject();
    delete (returnedUser as any).passwordHash;

    return {
      user: returnedUser as unknown as IUser,
      token,
    };
  }
}

export default AuthService;
