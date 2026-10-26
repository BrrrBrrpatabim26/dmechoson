import { VerificationToken } from '../../entities/verification-token.entity.js';

export interface IVerificationTokenRepository {
  create(token: Partial<VerificationToken>): Promise<VerificationToken>;
  findActiveByTarget(
    target: string,
    purpose: string,
    tokenType: string,
  ): Promise<VerificationToken | null>;
  findByTokenHash(tokenHash: string): Promise<VerificationToken | null>;
  incrementAttempts(id: string): Promise<number>;
  consume(id: string): Promise<void>;
  revokeAllForTarget(target: string, purpose: string): Promise<void>;
}
