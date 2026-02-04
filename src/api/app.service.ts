import {
  ClassSerializerInterceptor,
  HttpStatus,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { winstonConfig } from '../infrastructure/winston/winston-config';
import { AppModule } from '../api/app.module';
import { AllExceptionsFilter } from '../infrastructure/exception/All-exception-filter';
import { config } from '../config';

@Injectable()
export class Application {
  private readonly API_PREFIX = 'api/v1';
  private readonly SWAGGER_PATH = 'api/docs';

  async start(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: winstonConfig,
    });

    this.configureMiddleware(app);
    this.configureGlobalSettings(app);
    this.configureSwagger(app);

    await app.listen(config.PORT, () => {
      console.log(`🚀 Server: ${config.BACKEND_URL}/${this.API_PREFIX}`);
      console.log(`📝 Swagger: ${config.SWAGGER_URL}`);
    });
  }

  private configureMiddleware(app: NestExpressApplication): void {
    app.use(cookieParser());
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  }

  private configureGlobalSettings(app: NestExpressApplication): void {
    const httpAdapter = app.get(HttpAdapterHost);
    const reflector = app.get(Reflector);

    app.setGlobalPrefix(this.API_PREFIX);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        disableErrorMessages: config.NODE_ENV === 'production',
        exceptionFactory: (errors) => ({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: errors.map((e) => Object.values(e.constraints || {})).flat(),
          error: 'Validation Failed',
        }),
      }),
    );
  }

  private configureSwagger(app: NestExpressApplication): void {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Template API')
      .setDescription('Template API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(this.SWAGGER_PATH, app, document);
  }
}
