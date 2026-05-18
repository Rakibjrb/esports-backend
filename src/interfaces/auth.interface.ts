import { UserRole } from './user.interface';

export interface IJWTPayload {
  userId: string;
  role: UserRole;
}
