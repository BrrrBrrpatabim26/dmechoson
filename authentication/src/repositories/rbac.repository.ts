import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IRbacRepository } from '../core/interfaces/repositories.interface.js';
import { Role } from '../entities/role.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { Membership } from '../entities/membership.entity.js';
import { MembershipRole } from '../entities/membership-role.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';

@Injectable()
export class RbacRepository implements IRbacRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(MembershipRole)
    private readonly membershipRoleRepo: Repository<MembershipRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async findRolesByUserId(userId: string): Promise<Role[]> {
    // Toi uu A1: gop 3 query (memberships -> membership_roles -> roles) thanh 1 JOIN.
    // DISTINCT de khong trùng role khi user thuoc nhieu membership.
    // CHI tinh membership 'active' — membership 'suspended' phải thu hồi quyền tương ứng.
    return this.roleRepo
      .createQueryBuilder('r')
      .distinct(true)
      .innerJoin(MembershipRole, 'mr', 'mr.role_id = r.id')
      .innerJoin(Membership, 'm', 'm.id = mr.membership_id AND m.status = :status', { status: 'active' })
      .where('m.user_id = :userId', { userId })
      .getMany();
  }

  async findPermissionsByRoleIds(roleIds: string[]): Promise<Permission[]> {
    if (roleIds.length === 0) {
      return [];
    }

    // Toi uu A2: gop 2 query (role_permissions -> permissions) thanh 1 JOIN.
    return this.permissionRepo
      .createQueryBuilder('p')
      .distinct(true)
      .innerJoin(RolePermission, 'rp', 'rp.permission_id = p.id')
      .where('rp.role_id IN (:...ids)', { ids: roleIds })
      .getMany();
  }

  async findOrCreateRole(
    name: string,
    isSystem: boolean = false,
    description?: string,
  ): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { name } });
    if (existing) {
      return existing;
    }

    const role = this.roleRepo.create({
      id: uuidv7(),
      name,
      isSystem,
      description: description || `Role ${name}`,
    });

    return this.roleRepo.save(role);
  }

  async findOrCreatePermission(code: string, description?: string): Promise<Permission> {
    const existing = await this.permissionRepo.findOne({ where: { code } });
    if (existing) {
      return existing;
    }

    const perm = this.permissionRepo.create({
      id: uuidv7(),
      code,
      description: description || `Permission ${code}`,
    });

    return this.permissionRepo.save(perm);
  }

  async assignRoleToUser(userId: string, roleId: string, orgId?: string | null): Promise<void> {
    // Tìm hoặc tạo membership
    let membership = await this.membershipRepo.findOne({
      where: { userId },
    });

    if (!membership) {
      membership = this.membershipRepo.create({
        id: uuidv7(),
        userId,
        orgId: orgId || uuidv7(), // Default org placeholder nếu chưa có org riêng
        status: 'active',
        joinedAt: new Date(),
      });
      membership = await this.membershipRepo.save(membership);
    }

    // Kiểm tra gán role
    const existingAssign = await this.membershipRoleRepo.findOne({
      where: { membershipId: membership.id, roleId },
    });

    if (!existingAssign) {
      const newAssign = this.membershipRoleRepo.create({
        membershipId: membership.id,
        roleId,
        assignedAt: new Date(),
      });
      await this.membershipRoleRepo.save(newAssign);
    }
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { name } });
  }

  async findRoleById(roleId: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id: roleId } });
  }

  async listRoles(): Promise<Role[]> {
    return this.roleRepo.find({ order: { name: 'ASC' } });
  }

  async findPermissionsByRoleId(roleId: string): Promise<Permission[]> {
    return this.permissionRepo
      .createQueryBuilder('p')
      .innerJoin(RolePermission, 'rp', 'rp.permission_id = p.id')
      .where('rp.role_id = :roleId', { roleId })
      .orderBy('p.code', 'ASC')
      .getMany();
  }

  async findPermissionByCode(code: string): Promise<Permission | null> {
    return this.permissionRepo.findOne({ where: { code } });
  }

  async linkRolePermission(roleId: string, permissionId: string): Promise<void> {
    // Idempotent: khóa ghép (role_id, permission_id) — insert hoặc bỏ qua nếu đã tồn tại.
    const existing = await this.rolePermissionRepo.findOne({
      where: { roleId, permissionId },
    });
    if (!existing) {
      await this.rolePermissionRepo.insert({ roleId, permissionId });
    }
  }

  async unlinkRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.rolePermissionRepo.delete({ roleId, permissionId });
    return (result.affected ?? 0) > 0;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const membership = await this.membershipRepo.findOne({ where: { userId } });
    if (!membership) {
      return false;
    }
    const result = await this.membershipRoleRepo.delete({ membershipId: membership.id, roleId });
    return (result.affected ?? 0) > 0;
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    // Mỗi user đúng 1 membership (mô hình hiện tại) -> đếm bản ghi gán là đủ.
    return this.membershipRoleRepo.count({ where: { roleId } });
  }

  async deleteRole(roleId: string): Promise<boolean> {
    // Xóa role động: dọn quan hệ gán (membership_roles, role_permissions) trước rồi xóa role.
    // Chạy trong transaction để không để lại tham chiếu mồ côi nếu fail giữa chừng.
    await this.roleRepo.manager.transaction(async (em) => {
      await em.delete(MembershipRole, { roleId });
      await em.delete(RolePermission, { roleId });
      const result = await em.delete(Role, { id: roleId });
      if ((result.affected ?? 0) === 0) {
        throw new Error(`Role ${roleId} không tồn tại`);
      }
    });
    return true;
  }
}
