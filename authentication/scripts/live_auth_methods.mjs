#!/usr/bin/env node
/**
 * live_auth_methods.mjs — Kiểm thử THẬT các phương thức xác thực còn lại
 * (email_otp, phone_otp, magic_link, github, passkey-options) trên auth-service đang chạy.
 *
 * Yêu cầu: service chạy với MAIL_STRATEGY=console (để mã OTP / Magic Link in ra `docker logs`),
 *          container tên `auth-service`, tiếp cận được bằng `docker logs`.
 * Chạy:    node scripts/live_auth_methods.mjs
 * Tu chon: BASE_URL, CONTAINER
 *
 * Thoat 0 nếu PASS, 1 nếu có FAIL. (Google/Passkey verify cần tương tác => chỉ kiểm tra bước khả thi headless.)
 */
import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE_URL || 'http://localhost:3001/api/v1';
const CONTAINER = process.env.CONTAINER || 'auth-service';

const results = [];
let failures = 0;
let warnings = 0;
const icon = { PASS: '[PASS]', FAIL: '[FAIL]', WARN: '[WARN]' };
const emit = (s, n, d) => console.log(`${icon[s]} ${n}${d ? '  -> ' + d : ''}`);
const PASS = (n, d = '') => {
  results.push(['PASS', n, d]);
  emit('PASS', n, d);
};
const FAIL = (n, d = '') => {
  failures += 1;
  results.push(['FAIL', n, d]);
  emit('FAIL', n, d);
};
const WARN = (n, d = '') => {
  warnings += 1;
  results.push(['WARN', n, d]);
  emit('WARN', n, d);
};

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* 302/empty */
    }
    return { status: res.status, json, location: res.headers.get('location') };
  } catch (e) {
    return { status: 0, json: null, location: null, err: `${e.name}: ${e.message}` };
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function containerLogs(tail = 60) {
  try {
    return execFileSync('docker', ['logs', '--tail', String(tail), CONTAINER], { encoding: 'utf8' });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

function lastMatch(re) {
  const logs = containerLogs();
  let last = null;
  let m;
  const g = new RegExp(re.source, 'g');
  // eslint-disable-next-line no-cond-assign
  while ((m = g.exec(logs)) !== null) last = m[1];
  return last;
}

async function main() {
  console.log(`\n=== LIVE METHODS :: ${BASE} (MAIL_STRATEGY=console) ===\n`);

  const health = await api('GET', '/health');
  health.status === 200 ? PASS('GET /health', 'ok') : FAIL('GET /health', `status=${health.status}`);

  // ---------- EMAIL OTP ----------
  const otpEmail = `otp-${Date.now()}@example.com`;
  const e1 = await api('POST', '/auth/otp/send', { body: { target: otpEmail, channel: 'email', purpose: 'login' } });
  e1.status === 200 ? PASS('POST /otp/send (email) -> 200') : FAIL('POST /otp/send email', `status=${e1.status} ${JSON.stringify(e1.json?.error || {})}`);
  await sleep(500);
  const emailCode = lastMatch(/OTP của bạn là:\s*(\d{6})/);
  if (!emailCode) {
    FAIL('Đọc OTP email từ logs', 'không thấy mã trong docker logs');
  } else {
    const v = await api('POST', '/auth/otp/verify', { body: { target: otpEmail, otp: emailCode, purpose: 'login', displayName: 'OTP User', deviceName: 'live-otp' } });
    v.status === 200 && v.json?.data?.accessToken
      ? PASS('POST /otp/verify (email) -> 200 + token', `code=${emailCode}, userId=${v.json.data.user?.id?.slice(0, 8)}`)
      : FAIL('POST /otp/verify email', `status=${v.status} ${JSON.stringify(v.json?.error || {})}`);
    // Sai mã -> 400 OTP_INVALID (gửi lại để còn token mới)
    await api('POST', '/auth/otp/send', { body: { target: otpEmail + 'x', channel: 'email', purpose: 'login' } });
    await sleep(400);
    const bad = await api('POST', '/auth/otp/verify', { body: { target: otpEmail + 'x', otp: '000000', purpose: 'login' } });
    bad.status >= 400 ? PASS('OTP sai -> bị từ chối', `status=${bad.status} ${bad.json?.error?.code || ''}`) : WARN('OTP sai', `status=${bad.status}`);
  }

  // ---------- PHONE OTP (SMS simulation) ----------
  const phone = `+849${Date.now().toString().slice(-8)}`;
  const p1 = await api('POST', '/auth/otp/send', { body: { target: phone, channel: 'sms', purpose: 'login' } });
  p1.status === 200 ? PASS('POST /otp/send (sms) -> 200') : FAIL('POST /otp/send sms', `status=${p1.status} ${JSON.stringify(p1.json?.error || {})}`);
  await sleep(500);
  const smsCode = lastMatch(/\[SMS OTP SIMULATION\][^\d]{0,40}(\d{6})/);
  if (!smsCode) {
    FAIL('Đọc OTP SMS từ logs', 'không thấy dòng [SMS OTP SIMULATION]');
  } else {
    const v = await api('POST', '/auth/otp/verify', { body: { target: phone, otp: smsCode, purpose: 'login', displayName: 'Phone User', deviceName: 'live-sms' } });
    v.status === 200 && v.json?.data?.accessToken
      ? PASS('POST /otp/verify (sms) -> 200 + token', `code=${smsCode}, userId=${v.json.data.user?.id?.slice(0, 8)}`)
      : FAIL('POST /otp/verify sms', `status=${v.status} ${JSON.stringify(v.json?.error || {})}`);
  }

  // ---------- MAGIC LINK ----------
  const mlEmail = `magic-${Date.now()}@example.com`;
  const m1 = await api('POST', '/auth/magic-link/send', { body: { email: mlEmail } });
  m1.status === 200 ? PASS('POST /magic-link/send -> 200') : FAIL('POST /magic-link/send', `status=${m1.status} ${JSON.stringify(m1.json?.error || {})}`);
  await sleep(500);
  const mlToken = lastMatch(/magic-link\/verify\?token=([A-Za-z0-9_\-]+)/);
  if (!mlToken) {
    FAIL('Đọc Magic Link token từ logs', 'không thấy URL token');
  } else {
    const v = await api('POST', '/auth/magic-link/verify', { body: { token: mlToken, deviceName: 'live-magic' } });
    v.status === 200 && v.json?.data?.accessToken
      ? PASS('POST /magic-link/verify -> 200 + token', `token=${mlToken.slice(0, 12)}...`)
      : FAIL('POST /magic-link/verify', `status=${v.status} ${JSON.stringify(v.json?.error || {})}`);
  }

  // ---------- GITHUB (server-side initiation) ----------
  const gh = await api('GET', '/auth/github');
  if (gh.status === 302) PASS('GET /github -> 302 toi provider', gh.location?.slice(0, 50));
  else if (gh.json?.error?.code === 'AUTH_METHOD_DISABLED') PASS('GET /github -> 403 AUTH_METHOD_DISABLED', 'chưa cấu hình GITHUB_CLIENT_ID (hanh vi dung)');
  else WARN('GET /github', `status=${gh.status}`);

  // ---------- PASSKEY (WebAuthn options - headless được phần options) ----------
  const pkEmail = `pk-${Date.now()}@example.com`;
  const su = await api('POST', '/auth/signup', { body: { email: pkEmail, password: 'StrongPass123@', userName: 'Pk' } });
  const pkToken = su.json?.data?.accessToken;
  su.status === 201 && pkToken ? PASS('signup (nền cho passkey) -> 201') : FAIL('signup cho passkey', `status=${su.status}`);
  if (pkToken) {
    const reg = await api('POST', '/auth/mfa/passkey/register/options', { token: pkToken });
    const ro = reg.json?.data;
    reg.status === 200 && ro?.challenge && ro?.rp?.id
      ? PASS('POST /passkey/register/options -> 200 (creation options)', `rp.id=${ro.rp.id}, challenge=${String(ro.challenge).slice(0, 8)}...`)
      : FAIL('POST /passkey/register/options', `status=${reg.status} ${JSON.stringify(reg.json?.error || {})}`);
  }
  const auth = await api('POST', '/auth/mfa/passkey/authenticate/options', { body: { email: pkEmail } });
  const ao = auth.json?.data;
  auth.status === 200 && ao?.challenge
    ? PASS('POST /passkey/authenticate/options -> 200 (request options)', `challenge=${String(ao.challenge).slice(0, 8)}...`)
    : FAIL('POST /passkey/authenticate/options', `status=${auth.status} ${JSON.stringify(auth.json?.error || {})}`);
  WARN('Passkey register/auth VERIFY', 'cần authenticator thật (navigator.credentials) -> ngoài khả năng headless');

  report();
}

function report() {
  const icon = { PASS: '[PASS]', FAIL: '[FAIL]', WARN: '[WARN]' };
  console.log('\n--- Kết quả kiểm thử các phương thức còn lại ---');
  for (const [s, n, d] of results) console.log(`${icon[s]} ${n}${d ? '  -> ' + d : ''}`);
  console.log(`\nTổng: ${results.length}  PASS=${results.filter((r) => r[0] === 'PASS').length}  FAIL=${failures}  WARN=${warnings}`);
  process.exitCode = failures > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error('\nLỗi không mong đợi:', e);
  process.exitCode = 1;
});
