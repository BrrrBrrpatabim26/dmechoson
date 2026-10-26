/**
 * Parse chuỗi hạn mức kiểu `15m` / `3600s` / `12h` / `7d` ra số giây.
 * Dùng chung cho JWT expiry và TTL các deny-list phái sinh từ vòng đời access token.
 */
export function parseDurationToSeconds(duration: string, fallbackSeconds = 900): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return fallbackSeconds;

  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return fallbackSeconds;
  }
}
