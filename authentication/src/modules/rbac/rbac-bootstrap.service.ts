import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_ROLES, PERMISSION_CODES } from '../../common/constants/permission-codes.constant.js';
import type { IRbacRepository } from '../../core/interfaces/repositories.interface.js';
import type { IUserEmailRepository } from '../../core/interfaces/repositories.interface.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { resolveSuperAdminRoles, DEFAULT_USER_ROLE_FALLBACK } from '../../common/utils/super-roles.util.js';

/** Permission wildcard — toan quyen theo DUA KINH (nam trong DB, khong doc ten role hard-code). */
export const PERMISSION_WILDCARD = '*';

/**
 * Seed danh mục phân quyền lúc khởi động (idempotent — chạy lại bao nhiêu lần cũng an toàn):
 *
 * 1. Toàn bộ `PERMISSION_CODES` được ghi vào bảng `permissions` (trước đây chỉ là hằng số
 *    "treo trên trời" — không row nào tồn tại nên không role nào gán được quyền).
 * 2. Ba role hệ thống USER / ADMIN / SUPER_ADMIN với `isSystem=true`.
 * 3. Bootstrap quản trị đầu tiên: `ADMIN_BOOTSTRAP_EMAILS` (csv, mặc định RỖNG = tắt) —
 *    gán SUPER_ADMIN cho user khớp email đã tồn tại. Đây là đường thoát "con gà quả trứng"
 *    (không có API nào tạo SUPER_ADMIN nếu chưa có SUPER_ADMIN) mà KHÔNG cần thao tác DB
 *    thủ công (AGENTS 1.2 #12). Mỗi lần grant đều log để giám sát.
 */
@Injectable()
export class RbacBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacBootstrapService.name);

  constructor(
    @Inject(INJECTION_TOKENS.RBAC_REPOSITORY)
    private readonly rbacRepo: IRbacRepository,

    @Inject(INJECTION_TOKENS.USER_EMAIL_REPOSITORY)
    private readonly emailRepo: IUserEmailRepository,

    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedCatalog();
    await this.applyBootstrapAdmins();
  }

  private async seedCatalog(): Promise<void> {
    for (const code of Object.values(PERMISSION_CODES)) {
      await this.rbacRepo.findOrCreatePermission(code);
    }
    // Wildcard '*' dang ky nhu permission he thong — toan quyen duoc dieu khien bang DATA,
    // khong phai ten role chuoi literals trong code.
    const wildcard = await this.rbacRepo.findOrCreatePermission(PERMISSION_WILDCARD, 'Toan quyen (wildcard)');

    const defaultUserRole =
      (this.configService.get<string>('auth.defaultUserRole') || '').trim().toUpperCase() ||
      DEFAULT_USER_ROLE_FALLBACK;
    await this.rbacRepo.findOrCreateRole(defaultUserRole, true, 'Vai trò người dùng thông thường');
    await this.rbacRepo.findOrCreateRole(DEFAULT_ROLES.ADMIN, true, 'Quản trị viên vận hành');

    // Moi role trong SUPER_ADMIN_ROLES cau hinh: ton tai trong DB + duoc ca '*' lan role he thong.
    for (const superRole of resolveSuperAdminRoles(this.configService.get<string[]>('auth.superAdminRoles'))) {
      const role = await this.rbacRepo.findOrCreateRole(superRole, true, 'Quản trị tối cao toàn hệ thống');
      await this.rbacRepo.linkRolePermission(role.id, wildcard.id);
    }

    this.logger.log(`Đã seed danh mục RBAC: ${Object.keys(PERMISSION_CODES).length + 1} permissions + roles (super roles tu cau hinh).`);
  }

  private async applyBootstrapAdmins(): Promise<void> {
    const raw = this.configService.get<string[]>('auth.adminBootstrapEmails');
    const emails = Array.isArray(raw) ? raw.filter((e) => e.length > 0) : [];
    if (emails.length === 0) {
      return;
    }

    // Grant super role dau tien trong danh sach cau hinh (khong hard-code ten).
    const superRoleName = resolveSuperAdminRoles(this.configService.get<string[]>('auth.superAdminRoles'))[0];
    const superAdmin = await this.rbacRepo.findRoleByName(superRoleName);
    if (!superAdmin) {
      this.logger.error(`Không tìm thấy super role [${superRoleName}] sau seed — bỏ qua bootstrap emails.`);
      return;
    }

    for (const email of emails) {
      const normalized = email.trim().toLowerCase();
      if (!normalized) continue;
      const emailRecord = await this.emailRepo.findByEmail(normalized);
      if (!emailRecord) {
        this.logger.warn(`ADMIN_BOOTSTRAP_EMAILS: email [${normalized}] chưa tồn tại trong user_emails — bỏ qua.`);
        continue;
      }
      await this.rbacRepo.assignRoleToUser(emailRecord.userId, superAdmin.id);
      this.logger.log(`ADMIN_BOOTSTRAP_EMAILS: đã gán [${superAdmin.name}] cho user [${emailRecord.userId}] (${normalized}).`);
    }
  }
}
