#!/usr/bin/env node
/**
 * live-smoke.mjs — Script kiểm thử THAO TÁC THẬT vào một auth-service đang chạy.
 *
 * Mặc định bắn tới http://localhost:3098/api/v1 (auth-service trong Docker, ON_REDIS=true).
 * Chạy:  node scripts/live-smoke.mjs
 * Tu chon:
 *   BASE_URL=http://localhost:3001/api/v1 node scripts/live-smoke.mjs
 *   DOCKER_PROOF=0 node scripts/live-smoke.mjs     # bo qua buoc kiem chung Redis/DB qua docker
 *
 * Thoat code 0 neu PASS, 1 neu co FAIL. Khong can dependency (Node >= 18: global fetch).
 */

import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE_URL || 'http://localhost:3098/api/v1';
const DOCKER_PROOF = process.env.DOCKER_PROOF !== '0';
const REDIS_CONTAINER = process.env.REDIS_CONTAINER || 'auth-redis';
const PG_CONTAINER = process.env.PG_CONTAINER || 'auth-postgres';
const PG_DB = process.env.PG_DB || 'authentication';

const results = [];
let failures = 0;
let warnings = 0;

function record(status, name, detail = '') {
  results.push({ status, name, detail });
  if (status === 'FAIL') failures += 1;
  if (status === 'WARN') warnings += 1;
}
const PASS = (n, d = '') => record('PASS', n, d);
const FAIL = (n, d = '') => record('FAIL', n, d);
const WARN = (n, d = '') => record('WARN', n, d);

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* response khong phai JSON (vi du 302 redirect, docs HTML) */
  }
  return { status: res.status, json, location: res.headers.get('location') };
}

function exec(cmd, args) {
  // Dung execFile + argv array (khong qua shell) -> an toan, khong dich metacharacter.
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

async function main() {
  console.log(`\n=== LIVE SMOKE :: ${BASE} ===\n`);

  // 0) Song + config
  try {
    const m = await api('GET', '/auth/methods');
    if (m.status === 200 && Array.isArray(m.json?.data?.enabledMethods)) {
      PASS('GET /methods', m.json.data.enabledMethods.join(','));
    } else FAIL('GET /methods', `status=${m.status}`);
  } catch (e) {
    FAIL('Ket noi server', `${e.code || ''} ${e.message} (server chua chay? xem DEPLOYMENT.md)`);
    report();
    return;
  }

  const email = `smoke-${Date.now()}@example.com`;
  const password = 'StrongPassword123@';

  // 1) signup
  const su = await api('POST', '/auth/signup', { body: { email, password, userName: 'Smoke' } });
  if (su.status === 201 && su.json?.data?.accessToken) {
    PASS('POST /signup (201 + token)', `roles=${JSON.stringify(su.json.data.user.roles)}`);
  } else FAIL('POST /signup', `status=${su.status} ${JSON.stringify(su.json?.error || {})}`);

  // 2) signup trung email -> 409
  const dup = await api('POST', '/auth/signup', { body: { email, password } });
  dup.json?.error?.code === 'AUTH_EMAIL_ALREADY_EXISTS' && dup.status === 409
    ? PASS('POST /signup trung email -> 409', dup.json.error.code)
    : FAIL('POST /signup trung email', `status=${dup.status}`);

  // 3) signup sai dinh dang -> 400
  const bad = await api('POST', '/auth/signup', { body: { email: 'nope', password: 'x' } });
  bad.json?.error?.code === 'VALIDATION_ERROR' && bad.status === 400
    ? PASS('POST /signup sai dinh dang -> 400', 'VALIDATION_ERROR')
    : FAIL('POST /signup sai dinh dang', `status=${bad.status}`);

  // 4) signin dung
  const si = await api('POST', '/auth/signin', { body: { email, password } });
  const at = si.json?.data?.accessToken;
  const rt = si.json?.data?.refreshToken;
  si.status === 200 && at ? PASS('POST /signin dung -> 200') : FAIL('POST /signin', `status=${si.status}`);

  // 5) signin sai -> 401
  const siBad = await api('POST', '/auth/signin', { body: { email, password: 'Wrong@12345' } });
  siBad.json?.error?.code === 'AUTH_INVALID_CREDENTIALS' && siBad.status === 401
    ? PASS('POST /signin sai -> 401', siBad.json.error.code)
    : FAIL('POST /signin sai', `status=${siBad.status}`);

  // 6) /me
  const me = await api('GET', '/auth/me', { token: at });
  me.status === 200 && me.json?.data?.emails?.[0]?.email === email
    ? PASS('GET /me (Bearer) -> 200', `email=${me.json.data.emails[0].email}`)
    : FAIL('GET /me', `status=${me.status}`);

  // 7) /me khong token -> 401
  const meNo = await api('GET', '/auth/me');
  meNo.status === 401 ? PASS('GET /me khong token -> 401') : FAIL('GET /me khong token', `status=${meNo.status}`);

  // 8) admin dashboard (USER) -> 403 FORBIDDEN_ROLE
  const admin = await api('GET', '/auth/admin/dashboard', { token: at });
  admin.json?.error?.code === 'FORBIDDEN_ROLE' && admin.status === 403
    ? PASS('GET /admin/dashboard (USER) -> 403', 'FORBIDDEN_ROLE')
    : FAIL('GET /admin/dashboard', `status=${admin.status}`);

  // 9) refresh rotation + reuse detection (dung phien moi de khong anh huong buoc sau)
  const login2 = await api('POST', '/auth/signin', { body: { email, password } });
  const rt1 = login2.json?.data?.refreshToken;
  const r1 = await api('POST', '/auth/refresh', { body: { refreshToken: rt1 } });
  const rotated = r1.status === 200 && r1.json?.data?.refreshToken && r1.json.data.refreshToken !== rt1;
  rotated ? PASS('POST /refresh -> 200 + token MOI (rotation)') : FAIL('POST /refresh', `status=${r1.status}`);
  const reuse = await api('POST', '/auth/refresh', { body: { refreshToken: rt1 } });
  reuse.json?.error?.code === 'AUTH_TOKEN_REUSED' && reuse.status === 401
    ? PASS('Dung lại refresh cu -> 401 REUSE', reuse.json.error.code)
    : FAIL('Refresh reuse detection', `status=${reuse.status}`);

  // 10) change-password: sai current -> 401
  const cpWrong = await api('POST', '/auth/change-password', { token: at, body: { currentPassword: 'Nope@12345', newPassword: 'BrandNewPass123@' } });
  cpWrong.json?.error?.code === 'AUTH_INVALID_CREDENTIALS' && cpWrong.status === 401
    ? PASS('change-password sai current -> 401')
    : FAIL('change-password sai current', `status=${cpWrong.status}`);
  // 10b) change-password trung -> 400
  const cpSame = await api('POST', '/auth/change-password', { token: at, body: { currentPassword: password, newPassword: password } });
  cpSame.json?.error?.code === 'AUTH_PASSWORD_SAME_AS_CURRENT' && cpSame.status === 400
    ? PASS('change-password trung mk cu -> 400')
    : FAIL('change-password trung', `status=${cpSame.status}`);
  // 10c) doi thanh cong + login bang mk moi
  const newPass = 'BrandNewPass123@';
  const cpOk = await api('POST', '/auth/change-password', { token: at, body: { currentPassword: password, newPassword: newPass } });
  cpOk.status === 200 ? PASS('change-password dung -> 200') : FAIL('change-password', `status=${cpOk.status}`);
  const siNew = await api('POST', '/auth/signin', { body: { email, password: newPass } });
  siNew.status === 200 ? PASS('signin bang mat khau MOI -> 200') : FAIL('signin mk moi', `status=${siNew.status}`);

  // 11) sessions list
  const sess = await api('GET', '/auth/sessions', { token: siNew.json?.data?.accessToken });
  sess.status === 200 && Array.isArray(sess.json?.data)
    ? PASS('GET /sessions -> 200', `${sess.json.data.length} phien`)
    : FAIL('GET /sessions', `status=${sess.status}`);

  // 12) signout -> refresh sau do that bai
  const tokenForSignout = siNew.json?.data?.accessToken;
  const rtForSignout = siNew.json?.data?.refreshToken;
  const so = await api('POST', '/auth/signout', { token: tokenForSignout });
  so.status === 200 ? PASS('POST /signout -> 200') : FAIL('POST /signout', `status=${so.status}`);
  const afterOut = await api('POST', '/auth/refresh', { body: { refreshToken: rtForSignout } });
  afterOut.status === 401 ? PASS('refresh sau signout -> 401') : FAIL('refresh sau signout', `status=${afterOut.status}`);

  // 13) V2 security-capabilities (dung login moi vi phien truoc da signout)
  const loginV2 = await api('POST', '/auth/signin', { body: { email, password: newPass } });
  const caps2 = await apiV2('GET', '/auth/security-capabilities', { token: loginV2.json?.data?.accessToken });
  caps2.status === 200 && typeof caps2.json?.data?.mfaEnabled === 'boolean'
    ? PASS('GET v2 /security-capabilities -> 200', `mfaEnabled=${caps2.json.data.mfaEnabled} passkeySupported=${caps2.json.data.passkeySupported}`)
    : FAIL('GET v2 /security-capabilities', `status=${caps2.status}`);

  // 14) OAuth google: 302 (neu co creds) hoac 403 AUTH_METHOD_DISABLED (chua co creds)
  const gg = await api('GET', '/auth/google');
  if (gg.status === 302) PASS('GET /google -> 302 toi provider', gg.location?.slice(0, 60));
  else if (gg.json?.error?.code === 'AUTH_METHOD_DISABLED') WARN('GET /google -> 403', 'chua cau hinh GOOGLE_CLIENT_ID (hanh vi dung)');
  else WARN('GET /google', `status=${gg.status} (khong phai 302/403)`);

  // 15) Redis proof: RBAC cache key sau khi goi /me
  if (DOCKER_PROOF) {
    try {
      const out = exec('docker', ['exec', REDIS_CONTAINER, 'redis-cli', '--scan', '--pattern', 'rbac:access:*']);
      const n = out ? out.split('\n').filter(Boolean).length : 0;
      n > 0 ? PASS('Redis: co key rbac:access:*', `${n} key -> ON_REDIS dang dung`) : WARN('Redis: khong thay rbac:access:*', 'co the TTL da het hoac ON_REDIS=false');
    } catch (e) {
      WARN('Redis proof (docker)', String(e.message).split('\n')[0]);
    }
    // 16) DB proof: user da ton tai trong Postgres that
    try {
      const cnt = exec('docker', ['exec', PG_CONTAINER, 'psql', '-U', 'postgres', '-d', PG_DB, '-tAc', "select count(*) from users where status='active'"]);
      Number(cnt) > 0 ? PASS('Postgres: co dong users that', `count=${cnt}`) : FAIL('Postgres: users count=0');
    } catch (e) {
      WARN('DB proof (docker)', String(e.message).split('\n')[0]);
    }
  } else {
    WARN('Bo qua Redis/DB proof', 'DOCKER_PROOF=0');
  }

  report();
}

// Goi V2 (BASE dang /api/v1 -> thay = /api/v2)
async function apiV2(method, path, opts) {
  const v2base = BASE.replace(/\/v1$/, '/v2');
  const headers = {};
  if (opts?.token) headers.authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${v2base}${path}`, { method, headers });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* noop */
  }
  return { status: res.status, json };
}

function report() {
  const icon = { PASS: '[PASS]', FAIL: '[FAIL]', WARN: '[WARN]' };
  console.log('\n--- Ket qua thao tac thuc te ---');
  for (const r of results) console.log(`${icon[r.status]} ${r.name}${r.detail ? '  -> ' + r.detail : ''}`);
  console.log(`\nTong: ${results.length}  PASS=${results.filter((r) => r.status === 'PASS').length}  FAIL=${failures}  WARN=${warnings}`);
  process.exitCode = failures > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('\nLoi khong mong moi:', err);
  process.exitCode = 1;
});
