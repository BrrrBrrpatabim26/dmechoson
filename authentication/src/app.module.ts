import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Redis } from 'ioredis';
import configuration from './config/configuration.js';
import { yamlConfigurationLoader } from './config/yaml-loader.js';
import { validationSchema } from './config/validation.schema.js';
import { DatabaseModule } from './config/database.module.js';
import { IdentityModule } from './config/identity.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { RedisThrottlerStorage } from './modules/redis/redis-throttler.storage.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { INJECTION_TOKENS } from './core/tokens/injection.tokens.js';

/**
 * Root Module của Authentication Service.
 *
 * Nhiệm vụ:
 * 1. Nạp cấu hình toàn cục (ConfigModule): Đọc .env, file YAML và validate schema bằng Joi.
 * 2. Nạp hạ tầng Database (DatabaseModule): Kết nối tới PostgreSQL qua TypeORM.
 * 3. Nạp phân hệ Identity (IdentityModule): Quản lý 21 entities cơ sở dữ liệu.
 * 4. Nạp phân hệ Auth (AuthModule): Cung cấp các endpoints đăng ký, đăng nhập, xoay vòng token, đổi mật khẩu.
 * 5. Redis (RedisModule, toan cuc): CACHE_STORE in-memory hoac Redis tuy ON_REDIS.
 * 6. Rate limiting (ThrottlerModule): storage = Redis khi ON_REDIS, nguoc lai in-memory.
 */
@Module({
  imports: [
    // 1. Cấu hình biến môi trường toàn cục (Global Configuration)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [yamlConfigurationLoader, configuration],
      validationSchema,
      envFilePath: ['.env', 'apps/auth-service/.env'],
    }),

    // 2. Module quản lý kết nối cơ sở dữ liệu
    DatabaseModule,

    // 3. Module quản lý danh tính và phân quyền
    IdentityModule,

    // 4. Module nghiệp vụ xác thực chính
    AuthModule,

    // 4b. Health check (GET /api/v1/health) phục vụ probe Docker/Nginx (AGENTS 1.2 #10).
    HealthModule,

    // 5. Redis toàn cục (CACHE_STORE + REDIS_CLIENT), bat/tat bang ON_REDIS
    RedisModule,

    // 6. Rate limiting toan cuc; dung Redis storage khi ON_REDIS=true (scale ngang)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, INJECTION_TOKENS.REDIS_CLIENT],
      useFactory: (config: ConfigService, redisClient: Redis | null) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttler.ttl', 60000),
            limit: config.get<number>('throttler.limit', 20),
          },
        ],
        ...(redisClient ? { storage: new RedisThrottlerStorage(redisClient) } : {}),
      }),
    }),
  ],
  providers: [
    // Thu tu APP_GUARD toan cuc: throttle -> xac thinh (JWT) -> role -> permission.
    // Mac dinh PHONG THU (default-deny): route khong danh dau @Public() bat buoc co
    // Access Token hop le — khe qua `@UseGuards` o controller khong con lam ho
    // "vo tinh public" (AGENTS 1.2 #9). RolesGuard/PermissionsGuard tu do an toan
    // vi chi chat khi co metadata @RequireRoles/@RequirePermissions.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
