import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Constants
import {
  REFRESH_TOKEN_REPOSITORY,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
} from '@shared/constants/tokens';

// Controllers
import { AuthController } from './auth.controller';

// Repositories
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { RoleRepository } from '@infrastructure/repositories/role.repository';
import { RefreshTokenRepository } from '@infrastructure/repositories/refresh-token.repository';
import { TokenProvider } from './providers/token.provider';

// Services
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { I18nModule } from '@infrastructure/i18n/i18n.module';
import { CoreModule } from '@core/core.module';

// Command Handlers
import { RegisterUserCommandHandler } from '@application/commands/auth/register-user.command';
import { LoginCommandHandler } from '@application/commands/auth/login.command';
import { RefreshTokenCommandHandler } from '@application/commands/auth/refresh-token.command';
import { LogoutCommandHandler } from '@application/commands/auth/logout.command';

// Guards
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { TokenRefreshGuard } from '@presentation/guards/token-refresh.guard';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { ProfileController } from '@presentation/modules/auth/profile.controller';

const commandHandlers = [
  RegisterUserCommandHandler,
  LoginCommandHandler,
  RefreshTokenCommandHandler,
  LogoutCommandHandler,
];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    I18nModule,
    CoreModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController, ProfileController],
  providers: [
    // Services
    UserService,
    AuthService,

    // Repository tokens
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },

    // Guards - ORDER MATTERS! TokenRefreshGuard runs BEFORE JwtAuthGuard
    {
      provide: APP_GUARD,
      useClass: TokenRefreshGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Providers
    TokenProvider,

    // Strategy
    JwtStrategy,

    // Command handlers
    ...commandHandlers,
  ],
  exports: [UserService, AuthService],
})
export class AuthModule {}
