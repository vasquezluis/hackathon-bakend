import 'dotenv/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(
          errors.map((e) => ({
            property: e.property,
            message: Object.values(e.constraints ?? {}).join(', '),
          })),
        ),
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor(app.get('Reflector')));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
