import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { InfrastructureRepositoriesModule } from './repositories/infrastructure-repositories.module';
import { ThrottlerModule } from './throttler/throttler.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    InfrastructureRepositoriesModule,
    QueueModule,
    ThrottlerModule,
  ],
  exports: [
    InfrastructureRepositoriesModule,
    QueueModule,
    PrismaModule,
    ThrottlerModule,
  ],
})
export class InfrastructureModule {}
