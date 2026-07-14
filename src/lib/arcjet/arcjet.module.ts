import { Global, Module } from '@nestjs/common';
import {
  ArcjetModule as NestArcjetModule,
  detectBot,
  shield,
  slidingWindow,
} from '@arcjet/nest';

@Global()
@Module({
  imports: [
    NestArcjetModule.forRoot({
      isGlobal: true,
      key: process.env.ARCJET_KEY!,
      rules: [
        shield({ mode: process.env.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN' }),
        detectBot({
          mode: 'DRY_RUN',
          allow: ['CATEGORY:SEARCH_ENGINE'],
        }),
        slidingWindow({
          mode: 'LIVE',
          interval: 60,
          max: 10,
        }),
      ],
    }),
  ],
})
export class ArcjetModule {}
