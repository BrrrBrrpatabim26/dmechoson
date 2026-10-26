#!/usr/bin/env node
/**
 * bench.mjs — Do latency p50/p95 cua cac endpoint nong (dinh danh + doc quyen/RBAC),
 *.bat truyen qua HTTP that toi mot auth-service dang chay.
 *
 * Chay:  node scripts/bench.mjs
 * Tu chon:
 *   BASE_URL=http://localhost:3001/api/v1 N=100 CONC=10 node scripts/bench.mjs
 *
 * Mac dinh: BASE_URL=http://localhost:3098/api/v1, N=50, CONC=10.
 * Thoat code 1 neu khong ket noi duoc dich vu.
 */

const BASE = process.env.BASE_URL || 'http://localhost:3098/api/v1';
const N = Number(process.env.N || 50);
const CONC = Number(process.env.CONC || 10);

const email = `bench-${Date.now()}@example.com`;
const password = 'StrongPassword123@';

async function call(method, path, { token, body } = {}) {
  const t0 = process.hrtime.bigint();
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Doc het body de tinh thoi gian round-trip day du.
  await res.text();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { status: res.status, ms };
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function runLabel(label, makeTask, { accept = (s) => s < 400 } = {}) {
  const lat = [];
  let ok = 0;
  let throttled = 0;
  let other = 0;
  // Chay theo tung lo CONC lenh song song.
  for (let done = 0; done < N; done += CONC) {
    const batch = Array.from({ length: Math.min(CONC, N - done) }, async () => {
      try {
        const { status, ms } = await makeTask();
        if (status === 429) {
          throttled += 1; // bi rate-limit -> loai khoi mau latency
        } else if (accept(status) || (status >= 400 && status < 500)) {
          lat.push(ms);
          if (accept(status)) ok += 1;
          else other += 1;
        } else {
          other += 1; // 5xx
        }
      } catch {
        other += 1;
      }
    });
    await Promise.all(batch);
  }
  lat.sort((a, b) => a - b);
  const avg = lat.reduce((s, x) => s + x, 0) / (lat.length || 1);
  console.log(
    `${label.padEnd(26)} ok=${ok} throttled429=${throttled} khac=${other}  ` +
      `p50=${pct(lat, 50).toFixed(1)}ms  p95=${pct(lat, 95).toFixed(1)}ms  ` +
      `avg=${avg.toFixed(1)}ms (mau = khong bi 429)`,
  );
}

async function main() {
  console.log(`\n=== BENCH :: ${BASE}  (N=${N}, CONC=${CONC}) ===\n`);

  // Chuan bi: tao user + login de co token.
  let su;
  try {
    su = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, userName: 'Bench' }),
    }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));
  } catch (e) {
    console.error(`Khong ket noi duoc dich vu tai ${BASE}: ${e.code || e.message}`);
    console.error('Khoi dong: docker compose up -d  (hoac npm run start:dev) roi chay lai.');
    process.exitCode = 1;
    return;
  }

  let accessToken;
  if (su.status === 201) {
    accessToken = su.json?.data?.accessToken;
  } else {
    const si = await fetch(`${BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());
    accessToken = si?.data?.accessToken;
  }
  if (!accessToken) {
    console.error('Khong lay duoc accessToken (signup/signin that bai).');
    process.exitCode = 1;
    return;
  }

  // Do: /auth/me (goi getUserAccess -> RBAC JOIN + cache).
  await runLabel('GET /auth/me', () => call('GET', '/auth/me', { token: accessToken }));

  // Do: /auth/me khong token (duong 401 ngan -> latency floor; accept 401).
  await runLabel('GET /auth/me (401 floor)', () => call('GET', '/auth/me'), { accept: (s) => s === 401 });

  // Do: /auth/signin (Argon2 verify + sessions + refresh).
  await runLabel('POST /auth/signin', () => call('POST', '/auth/signin', { body: { email, password } }));

  console.log(
    '\nCai thien cau truc (khong doi API/DTO): getUserAccess 5->2 query (RBAC JOIN + cache),' +
      '\nrecordFailedAttempt atomic (chong lost-update), findById bo over-fetch phoneNumbers,' +
      '\nverification_tokens co index token_hash, throttler Redis = sliding-window.',
  );
}

main().catch((e) => {
  console.error('Loi khong mong moi:', e);
  process.exitCode = 1;
});
