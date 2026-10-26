/**
 * Dependency Injection Tokens (Symbol tokens cho Inversion of Control trong NestJS).
 */
export const INJECTION_TOKENS = {
  // Service Tokens
  AUTH_SERVICE: Symbol('IAuthService'),
  TOKEN_SERVICE: Symbol('ITokenService'),
  PASSWORD_HASHER: Symbol('IPasswordHasher'),
  RBAC_SERVICE: Symbol('IRbacService'),

  // Repository Tokens
  USER_REPOSITORY: Symbol('IUserRepository'),
  USER_EMAIL_REPOSITORY: Symbol('IUserEmailRepository'),
  IDENTITY_REPOSITORY: Symbol('IIdentityRepository'),
  AUTH_PROVIDER_REPOSITORY: Symbol('IAuthProviderRepository'),
  PASSWORD_CREDENTIAL_REPOSITORY: Symbol('IPasswordCredentialRepository'),
  SESSION_REPOSITORY: Symbol('ISessionRepository'),
  REFRESH_TOKEN_REPOSITORY: Symbol('IRefreshTokenRepository'),
  DEVICE_REPOSITORY: Symbol('IDeviceRepository'),
  LOGIN_AUDIT_LOG_REPOSITORY: Symbol('ILoginAuditLogRepository'),
  RBAC_REPOSITORY: Symbol('IRbacRepository'),
  VERIFICATION_TOKEN_REPOSITORY: Symbol('IVerificationTokenRepository'),
  OAUTH_TOKEN_REPOSITORY: Symbol('IOAuthTokenRepository'),
  MFA_FACTOR_REPOSITORY: Symbol('IMfaFactorRepository'),
  MFA_RECOVERY_CODE_REPOSITORY: Symbol('IMfaRecoveryCodeRepository'),
  PASSKEY_CREDENTIAL_REPOSITORY: Symbol('IPasskeyCredentialRepository'),
  MAIL_SENDER: Symbol('IMailSenderStrategy'),
  OTP_SERVICE: Symbol('IOtpService'),

  // Cache / Redis (KeyValueStore in-memory hoac Redis tuy ON_REDIS)
  CACHE_STORE: Symbol('KeyValueStore'),
  REDIS_CLIENT: Symbol('RedisClient'),
} as const;
