import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generate } from 'otplib';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MfaService } from '../src/modules/mfa/mfa.service.js';
import type { MfaFactor } from '../src/entities/mfa-factor.entity.js';

interface StoredFactor extends Partial<MfaFactor> {
  id: string;
  userId: string;
}

function buildMocks() {
  const factors: StoredFactor[] = [];
  const recoveryCodes: { id: string; userId: string; codeHash: string; usedAt: Date | null }[] = [];

  const factorRepo = {
    create: vi.fn(async (f: StoredFactor) => {
      factors.push(f);
      return f;
    }),
    findTotpByUserId: vi.fn(async (userId: string) => factors.find((f) => f.userId === userId && f.type === 'totp') ?? null),
    findEnabledFactorsByUserId: vi.fn(async (userId: string) => factors.filter((f) => f.userId === userId && f.isEnabled)),
    findById: vi.fn(async (id: string) => factors.find((f) => f.id === id) ?? null),
    update: vi.fn(async (partial: StoredFactor) => {
      const idx = factors.findIndex((f) => f.id === partial.id);
      if (idx >= 0) factors[idx] = { ...factors[idx], ...partial };
    }),
    disable: vi.fn(async (id: string) => {
      const idx = factors.findIndex((f) => f.id === id);
      if (idx >= 0) factors[idx].isEnabled = false;
    }),
  };

  const recoveryRepo = {
    deleteAllForUser: vi.fn(async (userId: string) => {
      for (let i = recoveryCodes.length - 1; i >= 0; i -= 1) {
        if (recoveryCodes[i].userId === userId) recoveryCodes.splice(i, 1);
      }
    }),
    createMany: vi.fn(async (codes: { id: string; userId: string; codeHash: string }[]) => {
      codes.forEach((c) => recoveryCodes.push({ ...c, usedAt: null }));
    }),
    findUnusedByUserId: vi.fn(async (userId: string) => recoveryCodes.filter((c) => c.userId === userId && !c.usedAt)),
    markUsed: vi.fn(async (id: string) => {
      const code = recoveryCodes.find((c) => c.id === id);
      if (code) code.usedAt = new Date();
    }),
  };

  const configService = {
    get: vi.fn((key: string, def?: unknown) => {
      if (key === 'mfa.encryptionKey') return 'unit-test-encryption-secret-key';
      if (key === 'mfa.issuer') return 'AgentCloud Test';
      if (key === 'mfa.recoveryCodeCount') return 8;
      return def;
    }),
  };

  return { factorRepo, recoveryRepo, configService, factors, recoveryCodes };
}

describe('Kiểm thử MFA / TOTP (RFC 6238 + Recovery Codes)', () => {
  let mocks: ReturnType<typeof buildMocks>;
  let service: MfaService;

  beforeEach(() => {
    mocks = buildMocks();
    service = new MfaService(mocks.factorRepo as never, mocks.recoveryRepo as never, mocks.configService as never);
  });

  it('setupTotp: sinh secret + otpauth URL, factor ở trạng thái chờ (chưa bật)', async () => {
    const setup = await service.setupTotp('user-1', 'user@example.com');

    expect(setup.secret).toBeTruthy();
    expect(setup.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    expect(mocks.factors[0].isEnabled).toBe(false);
    // Secret không được lưu dạng thô (đã mã hóa AES-GCM)
    expect(mocks.factors[0].secretEnc).not.toBeNull();
    expect(Buffer.isBuffer(mocks.factors[0].secretEnc)).toBe(true);
  });

  it('verifyTotp: mã hợp lệ -> bật factor và phát hành 8 recovery codes', async () => {
    const setup = await service.setupTotp('user-1', 'user@example.com');
    const code = await generate({ secret: setup.secret });

    const result = await service.verifyTotp('user-1', code);

    expect(result.valid).toBe(true);
    expect(result.recoveryCodes).toHaveLength(8);
    expect(mocks.factors[0].isEnabled).toBe(true);
    expect(mocks.factors[0].verifiedAt).toBeInstanceOf(Date);
  });

  it('verifyTotp: mã sai -> ném BadRequestException, factor vẫn chưa bật', async () => {
    await service.setupTotp('user-1', 'user@example.com');

    await expect(service.verifyTotp('user-1', '000000')).rejects.toThrow(BadRequestException);
    expect(mocks.factors[0].isEnabled).toBe(false);
  });

  it('verifyTotp: chưa setup -> ném NotFoundException', async () => {
    await expect(service.verifyTotp('user-no-factor', '123456')).rejects.toThrow(NotFoundException);
  });

  it('Recovery code: dùng 1 lần thành công, dùng lại sẽ bị từ chối', async () => {
    const setup = await service.setupTotp('user-1', 'user@example.com');
    const code = await generate({ secret: setup.secret });
    const { recoveryCodes } = await service.verifyTotp('user-1', code);
    const first = recoveryCodes![0];

    const used = await service.verifyRecoveryCode('user-1', first);
    expect(used.valid).toBe(true);
    expect(used.remaining).toBe(7);

    await expect(service.verifyRecoveryCode('user-1', first)).rejects.toThrow(BadRequestException);
  });

  it('listFactors: trả về factor đã bật + số mã phục hồi còn lại', async () => {
    const setup = await service.setupTotp('user-1', 'user@example.com');
    const code = await generate({ secret: setup.secret });
    await service.verifyTotp('user-1', code);

    const list = await service.listFactors('user-1');
    expect(list.factors).toHaveLength(1);
    expect(list.factors[0].type).toBe('totp');
    expect(list.remainingRecoveryCodes).toBe(8);
  });
});
