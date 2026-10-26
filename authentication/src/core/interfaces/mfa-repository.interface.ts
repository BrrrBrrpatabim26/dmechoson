import { MfaFactor } from '../../entities/mfa-factor.entity.js';
import { MfaRecoveryCode } from '../../entities/mfa-recovery-code.entity.js';

/**
 * Repository quản lý các yếu tố MFA (TOTP/SMS/Email/Passkey) của người dùng.
 */
export interface IMfaFactorRepository {
  create(factor: Partial<MfaFactor>): Promise<MfaFactor>;
  findTotpByUserId(userId: string): Promise<MfaFactor | null>;
  findEnabledFactorsByUserId(userId: string): Promise<MfaFactor[]>;
  findById(id: string): Promise<MfaFactor | null>;
  update(factor: Partial<MfaFactor> & { id: string }): Promise<void>;
  disable(id: string): Promise<void>;
}

/**
 * Repository quản lý mã dự phòng (recovery codes) cho MFA.
 */
export interface IMfaRecoveryCodeRepository {
  deleteAllForUser(userId: string): Promise<void>;
  createMany(codes: Partial<MfaRecoveryCode>[]): Promise<void>;
  findUnusedByUserId(userId: string): Promise<MfaRecoveryCode[]>;
  markUsed(id: string): Promise<void>;
}
