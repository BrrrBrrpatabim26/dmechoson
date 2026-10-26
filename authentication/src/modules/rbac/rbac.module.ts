import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { RepositoryModule } from '../../repositories/repository.module.js';
import { RbacService } from './rbac.service.js';
import { RbacBootstrapService } from './rbac-bootstrap.service.js';
import { RbacAdminController } from './rbac-admin.controller.js';

@Module({
  imports: [RepositoryModule],
  controllers: [RbacAdminController],
  providers: [
    RbacService,
    RbacBootstrapService,
    {
      provide: INJECTION_TOKENS.RBAC_SERVICE,
      useExisting: RbacService,
    },
  ],
  exports: [RbacService, RbacBootstrapService, INJECTION_TOKENS.RBAC_SERVICE],
})
export class RbacModule {}
