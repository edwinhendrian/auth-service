import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RpcException, Transport } from '@nestjs/microservices';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    options: { port: process.env.PORT },
    transport: Transport.TCP,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      validationError: { target: false, value: false },
      exceptionFactory: (validationErrors: ValidationError[]) => {
        return new RpcException(
          new BadRequestException(
            validationErrors.map((error) =>
              Object.values(error.constraints).join(', '),
            ),
          ),
        );
      },
    }),
  );

  app.listen().then(() => {
    console.log('Auth service is running..');
  });
}
bootstrap();
