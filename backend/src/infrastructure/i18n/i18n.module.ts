import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  I18nModule as NestI18nModule,
  HeaderResolver,
  AcceptLanguageResolver,
  QueryResolver,
  CookieResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    NestI18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('i18n.fallbackLocale') || 'en',
        loaderOptions: {
          path: path.join(process.cwd(), 'src/infrastructure/i18n/locales/'),
          watch: configService.get('env') === 'development',
        },
      }),
      resolvers: [
        { use: HeaderResolver, options: ['x-lang', 'x-locale', 'Accept-Language'] },
        AcceptLanguageResolver,
        { use: QueryResolver, options: ['lang', 'locale'] },
        { use: CookieResolver, options: ['lang', 'locale'] },
      ],
    }),
  ],
  providers: [],
  exports: [NestI18nModule],
})
export class I18nModule {}
