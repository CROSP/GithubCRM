import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, Get } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '@shared/decorators/public.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

// DTOs
import { RegisterDto } from '@application/dtos/auth/register.dto';
import { LoginDto } from '@application/dtos/auth/login.dto';
import { IJwtPayload } from '@application/dtos/responses/user.response';

// Commands
import { RegisterUserCommand } from '@application/commands/auth/register-user.command';
import { LoginCommand } from '@application/commands/auth/login.command';
import { LogoutCommand } from '@application/commands/auth/logout.command';

// Services
import { TokenProvider } from './providers/token.provider';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly tokenProvider: TokenProvider,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully. Returns access token + sets refresh token cookie.',
    schema: {
      properties: {
        accessToken: { type: 'string', description: 'JWT access token for Authorization header' },
        user: {
          type: 'object',
          description: 'User information',
          properties: {
            sub: { type: 'string' },
            email: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            permissions: { type: 'array', items: { type: 'string' } },
            emailVerified: { type: 'boolean' },
          },
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.commandBus.execute(new RegisterUserCommand(registerDto));

    // Generate tokens if registration successful
    if (result.user && result.accessToken !== undefined) {
      const tokens = await this.tokenProvider.generateTokens(
        result.user,
        result.permissions,
        result.isEmailVerified || false,
      );

      // Set ONLY refresh token as httpOnly cookie
      this.tokenProvider.setRefreshTokenCookie(response, tokens.refreshToken);

      // Return access token to client (client stores in localStorage/memory)
      return {
        accessToken: tokens.accessToken,
        user: tokens.user,
        message: 'Registration successful',
      };
    }

    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful. Returns JWT access token + sets secure refresh token cookie.',
    schema: {
      properties: {
        accessToken: {
          type: 'string',
          description: 'JWT access token - store in localStorage or memory',
        },
        user: {
          type: 'object',
          description: 'User information',
          properties: {
            sub: { type: 'string' },
            email: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            permissions: { type: 'array', items: { type: 'string' } },
            emailVerified: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.commandBus.execute(new LoginCommand(loginDto));

    // Generate tokens if login successful
    if (result.user && result.accessToken !== undefined) {
      const tokens = await this.tokenProvider.generateTokens(
        result.user,
        result.permissions,
        result.isEmailVerified || false,
      );

      // Set ONLY refresh token as httpOnly cookie
      this.tokenProvider.setRefreshTokenCookie(response, tokens.refreshToken);

      // Return access token to client
      return {
        accessToken: tokens.accessToken,
        user: tokens.user,
        message: 'Login successful',
      };
    }

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged out successfully' })
  async logout(
    @CurrentUser() user: IJwtPayload,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Revoke refresh tokens in database
    await this.commandBus.execute(new LogoutCommand(user.sub));

    // Clear refresh token cookie
    this.tokenProvider.clearRefreshTokenCookie(response);

    return {
      message: 'Logged out successfully',
      user: {
        id: user.sub,
        email: user.email,
      },
    };
  }

  @Get('me')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current user info from JWT token' })
  async me(@CurrentUser() user: IJwtPayload) {
    return {
      id: user.sub,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      emailVerified: user.emailVerified,
    };
  }
}
