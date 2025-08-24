import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RepositorySyncQueueService } from './repository-sync-queue.service';
import { RepositorySyncConsumer } from './repository-sync.consumer';
import { REPOSITORY_SYNC_QUEUE_SERVICE } from '@shared/constants/tokens';
import { CoreModule } from '@core/core.module';
import { InfrastructureServicesModule } from '@infrastructure/services/infrastructure-services.module'; // ← IMPORT CORE MODULE

@Module({
  imports: [
    CoreModule,
    InfrastructureServicesModule,
    // Configure BullMQ with Redis connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
        prefix: 'crm-queue',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),

    // Register the repository sync queue
    BullModule.registerQueue({
      name: 'repository-sync',
    }),
  ],
  providers: [
    {
      provide: REPOSITORY_SYNC_QUEUE_SERVICE,
      useClass: RepositorySyncQueueService,
    },
    RepositorySyncConsumer,
    InfrastructureServicesModule,
  ],
  exports: [REPOSITORY_SYNC_QUEUE_SERVICE, BullModule],
})
export class QueueModule {}
