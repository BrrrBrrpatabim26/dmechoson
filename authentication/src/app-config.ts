import { INestApplication, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ValidationException } from './common/exceptions/validation.exception.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

const logger = new Logger('AppConfig');

/**
 * Dich gia tri `TRUST_PROXY` sang dang Express `trust proxy` chap nhan.
 * - empty | 'false' -> false (mac dinh an toan: khong tin header X-Forwarded-For)
 * - 'true'          -> true (tin toan bo proxy o phia truoc)
 * - so nguyen       -> so hop proxy duoc tin (vd '1' khi sau 1 nginx)
 * - khac            -> danh sach ten/subnet cach nhau dau phay
 */
function resolveTrustProxy(raw: string | undefined): boolean | number | string | string[] {
  const value = (raw ?? '').trim();
  if (value === '' || value.toLowerCase() === 'false') return false;
  if (value.toLowerCase() === 'true') return true;
  if (/^\d+$/.test(value)) return Number(value);
  const list = value.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

/**
 * Dich `CORS_ORIGIN` (danh sach origin cach nhau dau phay).
 * - Co CORS_ORIGIN -> chi cho phep allowlist do.
 * - Khong co        -> non-production: phan anh moi origin (tien dev);
 *                       production: khong mo cross-origin (an toan mac dinh).
 */
function resolveCorsOrigin(raw: string | undefined): string[] | boolean {
  const value = (raw ?? '').trim();
  if (value) {
    const list = value.split(',').map((s) => s.trim()).filter(Boolean);
    return list;
  }
  return process.env.NODE_ENV !== 'production';
}

/**
 * Áp dụng toàn bộ cấu hình ứng dụng toàn cục (single source of truth).
 *
 * Được dùng chung bởi bootstrap thật (`main.ts`) và harness E2E
 * (`Test.createTestingModule(...).createNestApplication()`), đảm bảo đường dẫn
 * `/api/v{n}/...`, pipeline validate, exception filter nhất quán giữa prod và test.
 */
export function configureApp(app: INestApplication, _configService?: ConfigService): void {
  // Security headers (helmet). Tat CSP de Swagger UI (inline JS/CSS tai /docs) van chay;
  // cac header con lai (X-Frame-Options, nosniff, ...) van duoc bat.
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  // Chi tin header dinh danh (X-Forwarded-For) khi chay sau proxy tin cay (muc 1.2 #9).
  // Mac dinh false -> req.ip la dia chi socket that, khong the bi client gia mau.
  const httpServer = app.getHttpAdapter().getInstance() as {
    set?: (setting: string, value: unknown) => void;
  };
  httpServer.set?.('trust proxy', resolveTrustProxy(process.env.TRUST_PROXY));

  // CORS theo allowlist tu env; mac dinh an toan o production (muc 5.1).
  app.enableCors({
    origin: resolveCorsOrigin(process.env.CORS_ORIGIN),
    credentials: true,
  });

  // Thiết lập Global Prefix chuẩn quốc tế: /api
  app.setGlobalPrefix('api');

  // Kích hoạt chuẩn URI Versioning (/api/v1/..., /api/v2/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Đăng ký Global Exception Filter chuẩn hóa 100% response lỗi
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Validation Pipe: kiểm tra DTO và ném ValidationException
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((err) => ({
          field: err.property,
          constraints: err.constraints ? Object.values(err.constraints) : [],
        }));
        return new ValidationException(formattedErrors, 'Dữ liệu đầu vào không đáp ứng yêu cầu');
      },
    }),
  );
}

/**
 * Khởi tạo Swagger / OpenAPI (chỉ khi `swagger.enabled = true`).
 * Trả về `true` nếu Swagger đã được bật để caller quyết định log URL.
 */
export function setupSwagger(app: INestApplication, configService: ConfigService): boolean {
  const swaggerEnabled = configService.get<boolean>('swagger.enabled', true);
  if (!swaggerEnabled) {
    return false;
  }

  const appName = configService.get<string>('app.appName', 'Authentication Service');
  const swaggerPath = configService.get<string>('swagger.path', 'docs');

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName} API Documentation`)
    .setDescription(
      'Hệ thống xác thực & phân quyền phân tầng chuẩn (Authentication & Authorization Service).\n\n' +
        'Kiến trúc & Tính năng:\n' +
        '- **Controller Đa hình & API Versioning:** Hỗ trợ /api/v1/... và /api/v2/...\n' +
        '- **Cơ sở dữ liệu Đa hình (Database Strategy Pattern):** Hỗ trợ chuyển đổi linh hoạt giữa PostgreSQL và MySQL qua `DB_TYPE`\n' +
        '- **Thuật toán băm Đa hình:** Hỗ trợ Argon2id và Bcrypt\n' +
        '- **Phân quyền:** RBAC (Role-Based) & PBAC (Permission-Based với permissions: [])\n' +
        '- **Bảo mật phiên:** Quản lý Session, Device tracking, Refresh Token Rotation & Reuse Detection',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập Access Token theo định dạng: Bearer <token>',
        in: 'header',
      },
      'Bearer',
    )
    .addTag('Authentication V1 (Phiên bản 1)', 'Các endpoint xác thực chuẩn V1')
    .addTag('Authentication V2 (Phiên bản 2 - Mở rộng đa hình)', 'Các endpoint mở rộng đa hình V2')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  logger.log(`Swagger UI đã cấu hình tại đường dẫn: /${swaggerPath}`);
  return true;
}
