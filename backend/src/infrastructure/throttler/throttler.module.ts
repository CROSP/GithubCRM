import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerService } from '@infrastructure/services/throttler.service';
import { ThrottlerGuard } from '@presentation/guards/throttler.guard';
import { THROTTLER_SERVICE } from '@shared/constants/tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    ThrottlerService,
    {
      provide: THROTTLER_SERVICE,
      useClass: ThrottlerService,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerService],
})
export class ThrottlerModule {}
