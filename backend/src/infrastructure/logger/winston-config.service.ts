import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-mongodb';

@Injectable()
export class WinstonConfigService {
  constructor(private readonly configService: ConfigService) {}

  createWinstonModuleOptions(): WinstonModuleOptions {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const mongoUri = this.configService.get<string>(
      'MONGODB_URI',
      'mongodb://localhost:27017/your-app',
    );
    const appName = this.configService.get<string>('APP_NAME', 'GithubCRM');

    const transports: winston.transport[] = [];

    // Console transport for development
    if (environment === 'development') {
      transports.push(
        new winston.transports.Console({
          level: 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, context, ms, ...meta }) => {
              const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';

              return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${ms} ${metaString}`;
            }),
          ),
        }),
      );
    }

    // Console transport for production (structured logging)
    if (environment === 'production') {
      transports.push(
        new winston.transports.Console({
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      );
    }

    // MongoDB transport for persistent logging
    transports.push(
      new winston.transports.MongoDB({
        db: mongoUri,
        collection: 'application_logs',
        level: 'info',
        storeHost: true,
        capped: true,
        cappedSize: 100000000, // 100MB
        cappedMax: 50000, // Max 50k documents
        tryReconnect: true,
        decolorize: true,
        expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days retention
        metaKey: 'metadata',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    );

    // Domain Events specific MongoDB transport
    transports.push(
      new winston.transports.MongoDB({
        db: mongoUri,
        collection: 'domain_events',
        level: 'info',
        storeHost: true,
        capped: true,
        cappedSize: 200000000, // 200MB
        cappedMax: 100000, // Max 100k documents
        tryReconnect: true,
        decolorize: true,
        expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days retention for events
        metaKey: 'eventData',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    );

    // File transport for errors (production)
    if (environment === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
          maxsize: 50000000, // 50MB
          maxFiles: 5,
        }),
      );
    }

    return {
      level: environment === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: appName,
        environment,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      transports,
      exitOnError: false,
    };
  }
}
