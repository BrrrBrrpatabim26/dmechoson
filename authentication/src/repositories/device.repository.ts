import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IDeviceRepository } from '../core/interfaces/repositories.interface.js';
import { Device } from '../entities/device.entity.js';

@Injectable()
export class DeviceRepository implements IDeviceRepository {
  constructor(
    @InjectRepository(Device)
    private readonly repo: Repository<Device>,
  ) {}

  async findOrCreate(
    userId: string,
    userAgent?: string,
    label?: string,
  ): Promise<Device> {
    if (userAgent) {
      const existing = await this.repo.findOne({
        where: { userId, userAgent },
      });

      if (existing) {
        await this.repo.update(existing.id, { lastSeenAt: new Date() });
        return existing;
      }
    }

    const device = this.repo.create({
      id: uuidv7(),
      userId,
      label: label || 'Web Browser',
      platform: this.detectPlatform(userAgent),
      userAgent: userAgent || null,
      isTrusted: false,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    });

    return this.repo.save(device);
  }

  private detectPlatform(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    return 'Other';
  }
}
