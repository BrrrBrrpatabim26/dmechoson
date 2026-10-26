import { Logger } from '@nestjs/common';

interface ListenError extends NodeJS.ErrnoException {
  code?: string;
}

interface ListenCapable {
  listen(port: number): Promise<unknown>;
}

const logger = new Logger('PortFallback');

/**
 * Lắng nghe với cơ chế tự động tăng port (Port Auto-Increment).
 *
 * Nếu cổng cấu hình bị chiếm (EADDRINUSE), hệ thống sẽ thử cổng tiếp theo
 * cho đến khi tìm được cổng trống hoặc vượt quá số lần thử tối đa.
 * Trả về cổng thực tế đã bind thành công.
 */
export async function listenWithPortFallback(
  app: ListenCapable,
  startPort: number,
  autoIncrement: boolean,
  maxAttempts: number,
): Promise<number> {
  let actualPort = startPort;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await app.listen(actualPort);
      return actualPort;
    } catch (err) {
      const error = err as ListenError;
      if (error.code === 'EADDRINUSE' && autoIncrement) {
        if (attempt < maxAttempts) {
          logger.warn(
            `Cổng ${actualPort} đang bị chiếm. Tự động chuyển sang cổng ${actualPort + 1}...`,
          );
          actualPort += 1;
          continue;
        }
        throw new Error(
          `Không tìm được cổng trống trong khoảng ${startPort} - ${startPort + maxAttempts - 1}.`,
        );
      }
      throw err;
    }
  }

  throw new Error(
    `Không tìm được cổng trống trong khoảng ${startPort} - ${startPort + maxAttempts - 1}.`,
  );
}
