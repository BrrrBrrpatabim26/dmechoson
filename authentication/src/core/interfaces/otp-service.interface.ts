export interface IOtpService {
  sendOtp(
    target: string,
    channel: 'email' | 'sms',
    purpose: string,
    ip?: string,
  ): Promise<{ expiresInSeconds: number; target: string }>;

  verifyOtp(
    target: string,
    rawOtp: string,
    purpose: string,
  ): Promise<{ valid: boolean; userId: string | null }>;

  sendMagicLink(
    email: string,
    clientBaseUrl: string,
    ip?: string,
  ): Promise<{ expiresInSeconds: number; target: string }>;

  verifyMagicLink(
    rawToken: string,
  ): Promise<{ valid: boolean; email: string; userId: string | null }>;

  sendVerificationEmail(
    email: string,
    userId: string,
    clientBaseUrl: string,
    ip?: string,
  ): Promise<{ expiresInSeconds: number; target: string }>;

  verifyEmailToken(
    rawToken: string,
  ): Promise<{ valid: boolean; email: string; userId: string | null }>;
}
