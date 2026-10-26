/**
 * Danh mục các phương thức xác thực được hỗ trợ trong hệ thống.
 */
export const AUTH_METHODS = {
  PASSWORD: 'password',
  EMAIL_OTP: 'email_otp',
  PHONE_OTP: 'phone_otp',
  MAGIC_LINK: 'magic_link',
  GOOGLE: 'google',
  GITHUB: 'github',
  PASSKEY: 'passkey',
} as const;
