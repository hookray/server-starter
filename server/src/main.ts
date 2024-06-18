import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './filters/http.exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';

/**
 * 异步启动应用程序。
 * 
 * 这个函数首先创建一个新的NestFactory实例，然后获取应用程序的配置服务。
 * 它设置了一些全局选项，如启用关闭钩子、信任代理、启用CORS和设置全局前缀。
 * 它还使用了全局管道、过滤器和拦截器。
 * 最后，它在指定的端口上启动应用程序，并记录应用程序的URL。
 */
async function bootstrap() {
  // 创建一个新的日志记录器实例
  const logger = new Logger(bootstrap.name);

  // 创建一个新的NestFactory实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 获取应用程序的配置服务
  const config = app.get(ConfigService);

  // 从配置服务中获取端口号
  const PORT = config.get<number>('PORT');

  // 启用关闭钩子
  app.enableShutdownHooks();

  // 信任代理
  app.enable('trust proxy');

  // 启用CORS
  app.enableCors();

  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 使用全局管道
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  // 使用全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 使用全局拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 在指定的端口上启动应用程序
  await app.listen(PORT || 3000);

  // 获取应用程序的URL
  const url = await app.getUrl();

  // 记录应用程序的URL
  logger.log(`服务启动，访问地址：${url}`)
}


bootstrap();
