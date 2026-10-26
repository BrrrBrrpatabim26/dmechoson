import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp, setupSwagger } from './app-config.js';
import { listenWithPortFallback } from './common/utils/port.util.js';

const logger = new Logger('Bootstrap');

/**
 * Canh bao khi NODE_ENV=production ma WebAuthn rpId/origin van la localhost
 * (passkey se hong va kiem tra origin long le tren thuc te).
 * Dung WARNING (khong crash) vi WebAuthn la tuy chon va stack local chay NODE_ENV=production voi default localhost.
 */
function assertProductionWebauthn(configService: ConfigService): void {
  if (process.env.NODE_ENV !== 'production') return;
  const rpId = (configService.get<string>('webauthn.rpId') || '').toLowerCase();
  const origin = (configService.get<string>('webauthn.origin') || '').toLowerCase();
  const badHost = (v: string): boolean => v === '' || v.includes('localhost') || v.includes('127.0.0.1');
  if (badHost(rpId)) {
    logger.warn('[PROD-CHECK] WEBAUTHN_RP_ID dang la localhost/trim - can dat domain that khi chay production (passkey se khong hoat dong).');
  }
  if (badHost(origin) || !origin.startsWith('https://')) {
    logger.warn('[PROD-CHECK] WEBAUTHN_ORIGIN can la https://<domain> that khi chay production (hien tai: ' + (origin || 'trong') + ').');
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Graceful shutdown: bai SIGTERM/SIGINT va Goi onApplicationShutdown (Redis/DB dong ket noi).
  // (AGENTS 1.2 #10). Khorong app.close() thi cac hook shutdown khong chay.
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  // Các giá trị này đã được ConfigModule validate là BẮT BUỘC (không default che thiếu),
  // nên không đặt giá trị cứng ở đây (mục 6.1: cấm hardcode cổng trong code).
  const port = configService.get<number>('app.port');
  const portAutoIncrement = configService.get<boolean>('app.portAutoIncrement');
  const portMaxAttempts = configService.get<number>('app.portMaxAttempts');
  const appName = configService.get<string>('app.appName');

  // Cang an toan production cho WebAuthn (rpId/origin khong duoc localhost).
  assertProductionWebauthn(configService);

  // CORS, global prefix /api, URI versioning, global filter + validation pipe
  configureApp(app, configService);

  // Swagger / OpenAPI UI (bật/tắt theo cấu hình)
  const swaggerEnabled = setupSwagger(app, configService);

  // Bind port với cơ chế tự động tăng khi cổng bị chiếm (Port Auto-Increment)
  const actualPort = await listenWithPortFallback(app, port!, portAutoIncrement!, portMaxAttempts!);

  // Timeout cho keep-alive cua HTTP server (tranh giu ket noi mo vo han - muc 1.2 #10).
  const server = app.getHttpAdapter().getInstance() as {
    keepAliveTimeout?: number;
    headersTimeout?: number;
  };
  const keepAliveMs = Number(process.env.HTTP_KEEPALIVE_TIMEOUT_MS ?? 65000);
  server.keepAliveTimeout = keepAliveMs;
  server.headersTimeout = keepAliveMs + 5000;

  if (swaggerEnabled) {
    const swaggerPath = configService.get<string>('swagger.path', 'docs');
    logger.log(`Tài liệu Swagger UI sẵn sàng tại: http://localhost:${actualPort}/${swaggerPath}`);
  }
  logger.log(`${appName} đang lắng nghe tại: http://localhost:${actualPort}/api`);
}

void bootstrap();
