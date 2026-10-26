import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';

/**
 * Module Health Check: cung cấp `GET /api/v1/health` qua Terminus (ping DB).
 * TerminusModule đăng ký HealthCheckService + TypeOrmHealthIndicator.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
