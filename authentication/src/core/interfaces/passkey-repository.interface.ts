import { PasskeyCredential } from '../../entities/passkey-credential.entity.js';

/**
 * Repository quản lý credential passkey (WebAuthn public key) của người dùng.
 */
export interface IPasskeyCredentialRepository {
  create(credential: Partial<PasskeyCredential>): Promise<PasskeyCredential>;
  findByCredentialId(credentialId: Buffer): Promise<PasskeyCredential | null>;
  findByUserId(userId: string): Promise<PasskeyCredential[]>;
  updateSignCount(id: string, signCount: string, lastUsedAt: Date): Promise<void>;
}
