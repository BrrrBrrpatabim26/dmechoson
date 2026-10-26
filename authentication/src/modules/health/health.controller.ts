import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator.js';

/**
 * Endpoint Health Check (AGENTS 1.2 #10): phục vụ liveness/readiness probe của
 * Docker/K8s/Nginx. Trả về trạng thái ping DB. Không yêu cầu xác thực (`@Public`).
 *
 * Đường dẫn thực tế (global prefix `/api` + versioning mặc định `1`): `GET /api/v1/health`.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { connection: this.dataSource }),
    ]);
  }
}
