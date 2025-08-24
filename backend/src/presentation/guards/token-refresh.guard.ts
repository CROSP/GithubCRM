import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { RefreshTokenCommand } from '@application/commands/auth/refresh-token.command';
import { TokenProvider } from '@presentation/modules/auth/providers/token.provider';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';
import { IS_PUBLIC_KEY } from '@shared/decorators/public.decorator';

@Injectable()
export class TokenRefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private commandBus: CommandBus,
    private tokenProvider: TokenProvider,
    private reflector: Reflector,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(TokenRefreshGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip token refresh for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const authHeader = request.headers.authorization;
    const refreshTokenCookie =
      request.cookies?.[this.configService.get('REFRESH_COOKIE_NAME', 'refreshToken')];

    // If no auth header or refresh token, let JWT guard handle it
    if (!authHeader?.startsWith('Bearer ') || !refreshTokenCookie) {
      return true;
    }

    const accessToken = authHeader.substring(7);

    try {
      // Decode token without verification to check expiry
      const decoded = this.jwtService.decode(accessToken) as any;

      if (!decoded || !decoded.exp) {
        this.logger.debug('Token has no expiration, letting JWT guard handle');
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExpiry = decoded.exp;
      const timeUntilExpiry = tokenExpiry - currentTime;

      this.logger.debug({
        message: 'Token expiry check',
        currentTime,
        tokenExpiry,
        timeUntilExpiry,
        isExpired: timeUntilExpiry <= 0,
      });

      // If token is expired OR about to expire (within threshold)
      const thresholdInSeconds = this.getRefreshThresholdInSeconds();

      if (timeUntilExpiry <= thresholdInSeconds) {
        this.logger.debug({
          message: 'Token needs refresh',
          timeUntilExpiry,
          threshold: thresholdInSeconds,
        });

        const newAccessToken = await this.refreshAccessToken(refreshTokenCookie, response);

        if (newAccessToken) {
          // Update the Authorization header with new token so JWT guard sees the fresh token
          request.headers.authorization = `Bearer ${newAccessToken}`;

          // Also send it back to client in response header
          response.setHeader('X-New-Access-Token', newAccessToken);

          this.logger.debug('Token refreshed successfully, updated Authorization header');
        } else {
          this.logger.warn('Token refresh failed, letting JWT guard handle expired token');
        }
      }

      return true; // Always continue - let JWT guard do the final validation
    } catch (error) {
      this.logger.error('Error in token refresh guard:', error);
      return true; // Continue anyway - let JWT guard handle the error
    }
  }

  private async refreshAccessToken(
    refreshToken: string,
    response: Response,
  ): Promise<string | null> {
    try {
      this.logger.debug('Attempting to refresh access token');

      const result = await this.commandBus.execute(new RefreshTokenCommand({ refreshToken }));

      // Update the refresh token cookie with the new refresh token
      this.tokenProvider.setRefreshTokenCookie(response, result.refreshToken);

      this.logger.debug('Access token refresh successful');
      return result.accessToken;
    } catch (error) {
      this.logger.error('Access token refresh failed:', error);
      return null;
    }
  }

  private getRefreshThresholdInSeconds(): number {
    const threshold = this.configService.get('TOKEN_REFRESH_THRESHOLD', '5m');

    // Convert "5m" to seconds
    if (threshold.endsWith('m')) {
      return parseInt(threshold.slice(0, -1)) * 60;
    }
    if (threshold.endsWith('s')) {
      return parseInt(threshold.slice(0, -1));
    }
    if (threshold.endsWith('h')) {
      return parseInt(threshold.slice(0, -1)) * 3600;
    }

    return 300; // Default 5 minutes
  }
}
