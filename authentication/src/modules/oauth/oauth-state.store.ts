import * as crypto from 'crypto';
import type { IncomingMessage } from 'http';
import type { KeyValueStore } from '../../core/interfaces/cache.interface.js';

/** Thời gian sống của một lượt redirect OAuth (10 phút) — đủ cho round-trip consent của người dùng thật. */
const STATE_TTL_SECONDS = 600;

interface StateStoreRequest extends IncomingMessage {
  res?: { setHeader?: (name: string, value: string) => void };
}

/**
 * State-store cho passport-oauth2 (`options.store`) lưu state token chống CSRF (S3)
 * trong KeyValueStore (in-memory/Redis theo ON_REDIS) — KHONG cần express-session.
 *
 * Cơ chế:
 * - `store`: sinh token ngẫu nhiên 24 byte, lưu key one-use + Set-Cookie httpOnly
 *   `oauth_state_<provider>` để gắn lượt redirect với đúng trình duyệt đã khởi phát
 *   (chống kẻ tấn công tự khởi phát flow lấy state hợp lệ rồi ép callback nạn nhân).
 * - `verify`: so khớp state từ provider với cookie trên + consume key (one-use, chống replay).
 *
 * Interface theo đúng passport-oauth2 v1.8 (dispatch theo arity):
 * store(req, state, meta, done) / verify(req, state, done).
 */
export function createKvOAuthStateStore(
  cache: KeyValueStore,
  provider: string,
): {
  store: (req: StateStoreRequest, state: unknown, meta: unknown, done: (err: Error | null, state?: string) => void) => void;
  verify: (req: StateStoreRequest, state: string, done: (err: Error | null, ok?: boolean, state?: unknown) => void) => void;
} {
  const cookieName = `oauth_state_${provider}`;
  const keyOf = (token: string): string => `oauth:state:${provider}:${token}`;

  return {
    store(req, _state, _meta, done) {
      const token = crypto.randomBytes(24).toString('base64url');
      void (async () => {
        await cache.set(keyOf(token), '1', STATE_TTL_SECONDS);
        try {
          // Secure chi bat khi request den bang chinh HTTPS (hoc qua proxy tin cay dau cuoi);
          // ep Secure tren HTTP local (container NODE_ENV=production) khién trinh khong luu cookie.
          const secure = isHttpsRequest(req);
          req.res?.setHeader?.(
            'Set-Cookie',
            `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${STATE_TTL_SECONDS}${secure ? '; Secure' : ''}`,
          );
        } catch {
          /* header đã được gửi trước đó — cookie không đặt được, verify vẫn bắt buộc so khớp */
        }
        done(null, token);
      })().catch((err: Error) => done(err));
    },

    verify(req, state, done) {
      if (!state) {
        done(null, false);
        return;
      }
      void (async () => {
        const key = keyOf(state);
        const hit = await cache.get(key);
        await cache.del(key); // one-use: consume ngay cả khi thất bại, chống replay state
        const cookieToken = readCookieValue(req.headers?.cookie ?? '', cookieName);
        done(null, hit !== null && cookieToken === state);
      })().catch((err: Error) => done(err));
    },
  };
}

function isHttpsRequest(req: StateStoreRequest): boolean {
  // TLS socket co them co `encrypted` (tu `tls` module) — net.Socket typing khong khai bao.
  const socket = req.socket as unknown as { encrypted?: boolean } | undefined;
  if (socket?.encrypted) return true;
  const fwdProto = req.headers?.['x-forwarded-proto'];
  return typeof fwdProto === 'string' && fwdProto.split(',')[0].trim() === 'https';
}

function readCookieValue(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}
