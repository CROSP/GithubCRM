// User response interfaces

import { UserId } from '@core/value-objects/user-id.vo';

export interface IUserRoleResponse {
  id: string;
  name: string;
}

export interface IUserBaseResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
}

export interface IUserEntity {
  id: UserId;
}
export interface IGeneralResponse {
  message: string;
}

export interface IUserDetailResponse extends IUserBaseResponse {
  isActive: boolean;
  lastLoginAt?: Date;
  roles: IUserRoleResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithAuthResponse extends IUserBaseResponse {
  roles: IUserRoleResponse[];
}

export interface IAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: IUserEntity;
  userResponse: IUserWithAuthResponse;
}

export interface IAuthRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IJwtPayload {
  sub: string;
  userId?: string;
  email: string;
  emailVerified?: boolean;
  roles: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export type AuthResponse = IAuthTokenResponse | IGeneralResponse;
