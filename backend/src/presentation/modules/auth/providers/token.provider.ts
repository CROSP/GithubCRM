import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/entities/user.entity';

@Injectable()
export class TokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Generate JWT payload (same as before)
   */
  buildPayload(user: User, permissions: string[], isEmailVerified: boolean) {
    return {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      firstName: user.firstName.getValue(),
      lastName: user.lastName.getValue(),
      emailVerified: isEmailVerified,
      roles: user.roles.map(role => ({
        id: role.id.getValue(),
        name: role.name,
      })),
      permissions: permissions,
    };
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });
  }

  /**
   * Generate refresh token and store in DB
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(userId, refreshToken);
    return refreshToken;
  }

  /**
   * HYBRID: Generate tokens and set ONLY refresh token as httpOnly cookie
   * Return access token to client for localStorage/memory storage
   */
  async generateTokens(user: User, permissions: string[], isEmailVerified: boolean) {
    const payload = this.buildPayload(user, permissions, isEmailVerified);
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(user.id.getValue());

    return {
      accessToken, // Client stores this in localStorage or memory
      refreshToken, // We'll set this as httpOnly cookie
      user: payload,
    };
  }

  /**
   * Set ONLY refresh token as httpOnly cookie
   */
  setRefreshTokenCookie(response: Response, refreshToken: string) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieName = this.configService.get('REFRESH_COOKIE_NAME', 'refreshToken');

    response.cookie(cookieName, refreshToken, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict' as const, // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Clear refresh token cookie
   */
  clearRefreshTokenCookie(response: Response) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieName = this.configService.get('REFRESH_COOKIE_NAME', 'refreshToken');

    response.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
    });
  }
}
