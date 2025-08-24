import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { WinstonConfigService } from './winston-config.service';
import { LoggerService } from './logger.service';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useClass: WinstonConfigService,
    }),
  ],
  providers: [
    // Winston configuration service
    WinstonConfigService,

    // Concrete implementations
    LoggerService,
    {
      provide: ILOGGER_TOKEN,
      useExisting: LoggerService,
    },
  ],
  exports: [WinstonModule, LoggerService, ILOGGER_TOKEN],
})
export class LoggerModule {}
