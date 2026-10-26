import { describe, it, expect, vi } from 'vitest';
import { listenWithPortFallback } from '../src/common/utils/port.util.js';

function eaddrinuse(): Error {
  const err = new Error('listen EADDRINUSE: address already in use');
  (err as NodeJS.ErrnoException).code = 'EADDRINUSE';
  return err;
}

describe('Kiểm thử Port Auto-Increment (EADDRINUSE Fallback)', () => {
  it('Port trống ngay lần đầu -> bind đúng port cấu hình, không thử thêm', async () => {
    const listen = vi.fn().mockResolvedValue('http://localhost:3001');
    const app = { listen };

    const actual = await listenWithPortFallback(app, 3001, true, 20);

    expect(actual).toBe(3001);
    expect(listen).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(3001);
  });

  it('Port bị chiếm 3 lần liên tiếp -> tự động tăng port đến khi gặp port trống', async () => {
    const listen = vi
      .fn()
      .mockRejectedValueOnce(eaddrinuse())
      .mockRejectedValueOnce(eaddrinuse())
      .mockRejectedValueOnce(eaddrinuse())
      .mockResolvedValue('ok');

    const actual = await listenWithPortFallback({ listen }, 3001, true, 20);

    expect(actual).toBe(3004);
    expect(listen).toHaveBeenCalledTimes(4);
    expect(listen.mock.calls.map(([p]: number[]) => p)).toEqual([3001, 3002, 3003, 3004]);
  });

  it('Toàn bộ dải port bị chiếm -> ném lỗi rõ ràng sau maxAttempts lần thử', async () => {
    const listen = vi.fn().mockRejectedValue(eaddrinuse());

    await expect(listenWithPortFallback({ listen }, 3001, true, 3)).rejects.toThrow(
      /Không tìm được cổng trống/,
    );
    expect(listen).toHaveBeenCalledTimes(3);
  });

  it('Tắt PORT_AUTO_INCREMENT (false) -> ném thẳng lỗi EADDRINUSE, không thử port khác', async () => {
    const listen = vi.fn().mockRejectedValue(eaddrinuse());

    await expect(listenWithPortFallback({ listen }, 3001, false, 20)).rejects.toThrow(
      'listen EADDRINUSE: address already in use',
    );
    expect(listen).toHaveBeenCalledTimes(1);
  });

  it('Lỗi khác không phải EADDRINUSE (EACCES) -> ném ngay lập tức', async () => {
    const err = new Error('listen EACCES: permission denied');
    (err as NodeJS.ErrnoException).code = 'EACCES';
    const listen = vi.fn().mockRejectedValue(err);

    await expect(listenWithPortFallback({ listen }, 80, true, 20)).rejects.toThrow(
      'listen EACCES: permission denied',
    );
    expect(listen).toHaveBeenCalledTimes(1);
  });
});
