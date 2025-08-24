export interface UserContext {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  isActive?: boolean;
}
