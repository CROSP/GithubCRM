import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILOGGER_TOKEN,
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '@shared/constants/tokens';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IUserRepository } from '../repositories/user.repository.interface';
import { IRefreshTokenRepository } from '../repositories/refresh-token.repository.interface';
import {
  AuthenticationException,
  EntityNotFoundException,
} from '@core/exceptions/domain-exceptions';
import { UserId } from '@core/value-objects/user-id.vo';
import { Token } from '@core/value-objects/token.vo';
import { ILogger } from '@infrastructure/logger/logger.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly configService: ConfigService,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  private get tokenConfig() {
    return {
      refreshExpiration: parseInt(
        this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''),
        10,
      ),
    };
  }

  async createRefreshToken(userId: string, token: string): Promise<RefreshToken> {
    // Delete any existing refresh tokens for this user
    await this.refreshTokenRepository.deleteByUserId(userId);

    // Create a new refresh token
    const refreshToken = new RefreshToken(
      UserId.fromString(userId),
      new Token(token),
      this.tokenConfig.refreshExpiration,
    );

    return this.refreshTokenRepository.create(refreshToken);
  }

  async validateRefreshToken(token: string): Promise<RefreshToken> {
    this.logger.debug({ message: 'Validating refresh token' });

    const refreshToken = await this.refreshTokenRepository.findByToken(token);
    if (!refreshToken) {
      this.logger.warn({ message: 'Invalid refresh token, token not found in database' });
      throw new AuthenticationException('Invalid refresh token');
    }

    if (refreshToken.isExpired()) {
      this.logger.warn({
        message: 'Refresh token has expired',
        userId: refreshToken.userId.getValue(),
        expiresAt: refreshToken.expiresAt,
      });
      throw new AuthenticationException('Refresh token has expired');
    }

    if (refreshToken.isRevoked()) {
      this.logger.warn({
        message: 'Refresh token has been revoked',
        userId: refreshToken.userId.getValue(),
        revokedAt: refreshToken.revokedAt,
      });
      throw new AuthenticationException('Refresh token has been revoked');
    }

    this.logger.debug({
      message: 'Refresh token validated successfully',
      userId: refreshToken.userId.getValue(),
    });

    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findByToken(token);
    if (!refreshToken) {
      throw new AuthenticationException('Invalid refresh token');
    }

    if (refreshToken.isRevoked()) {
      // The Token is already revoked, no action needed
      return;
    }

    refreshToken.revoke();
    await this.refreshTokenRepository.update(refreshToken);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    await this.refreshTokenRepository.deleteByUserId(userId);
  }

  async updateLastLogin(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    user.updateLastLogin();

    return this.userRepository.update(user);
  }
}
