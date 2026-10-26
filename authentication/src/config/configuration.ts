export default () => ({
  app: {
    port: Number(process.env.PORT),
    portAutoIncrement: process.env.PORT_AUTO_INCREMENT !== 'false',
    portMaxAttempts: parseInt(process.env.PORT_MAX_ATTEMPTS || '20', 10),
    appName: process.env.APP_NAME || 'authentication service',
    clientUrl: process.env.CLIENT_URL,
  },

  // Cấu hình Cơ sở dữ liệu (PostgreSQL / TypeORM)
  // DB_HOST/DB_USERNAME/DB_DATABASE là BẮT BUỘC (Joi required) — KHÔNG đặt default che thiếu
  // (AGENTS 5.2/5.4: cấm fallback localhost/Postgres mặc định khi thiếu cấu hình).
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    // Chay migration tu dong luc boot (mang tinh index/schema). Mac dinh tat de
    // khong pha DB moi khi synchronize=false; bat bang DB_RUN_MIGRATIONS=true.
    runMigrations: process.env.DB_RUN_MIGRATIONS === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
    // Connection pool ( toi uu kha nang chiu tai song song).
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolIdleMs: parseInt(process.env.DB_POOL_IDLE_MS || '30000', 10),
  },

  // Cấu hình JSON Web Token & Refresh Token
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10),
  },

  // Cấu hình thuật toán băm mật khẩu đa hình (Argon2 / Bcrypt)
  hash: {
    defaultAlgorithm: process.env.HASH_DEFAULT_ALGORITHM || 'argon2id',
    argon2MemoryCost: parseInt(process.env.HASH_ARGON2_MEMORY_COST || '65536', 10),
    argon2TimeCost: parseInt(process.env.HASH_ARGON2_TIME_COST || '3', 10),
    argon2Parallelism: parseInt(process.env.HASH_ARGON2_PARALLELISM || '1', 10),
    bcryptRounds: parseInt(process.env.HASH_BCRYPT_ROUNDS || '12', 10),
  },

  // Cấu hình các phương thức xác thực (Auth Methods) được bật/tắt
  auth: {
    enabledMethods: (process.env.AUTH_ENABLED_METHODS || 'password,email_otp,phone_otp,magic_link,google,github,passkey')
      .split(',')
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean),
    emailVerificationEnabled: process.env.AUTH_EMAIL_VERIFICATION_ENABLED === 'true',
    rbacCacheTtlMs: parseInt(process.env.AUTH_RBAC_CACHE_TTL_MS || '60000', 10),
    // Bootstrap SUPER_ADMIN dau tien (csv email). Mac dinh RONG = tat — chi cap khi van hanh
    // muon phong quyen quan tri dau tien ma khong thao tac DB thu cong (AGENTS 1.2 #12).
    adminBootstrapEmails: (process.env.ADMIN_BOOTSTRAP_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    // Danh sách role toan quyen (csv) — guard/lockout-check doc tu day, khong hard-code
    // ten role trong code. Mac dinh 'SUPER_ADMIN'; bo sung/doi ten chi can sua env.
    superAdminRoles: process.env.SUPER_ADMIN_ROLES || 'SUPER_ADMIN',
    // Ten role mac dinh cap cho user moi signup (dong role trong DB theo ten nay).
    defaultUserRole: process.env.DEFAULT_USER_ROLE || 'USER',
  },

  // Rate limiting (chống brute-force cấp tầng HTTP)
  throttler: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '20', 10),
  },

  // OAuth 2.0 providers (chỉ hoạt động khi có client credentials thật)
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || '',
    },
  },

  // MFA / TOTP
  mfa: {
    issuer: process.env.MFA_ISSUER || 'AgentCloud Auth',
    recoveryCodeCount: parseInt(process.env.MFA_RECOVERY_CODE_COUNT || '8', 10),
    // Khóa chuyên dụng; để trống -> MfaService fallback sang JWT_SECRET (khong reuse ngam o day).
    encryptionKey: process.env.MFA_ENCRYPTION_KEY || '',
  },

  // Passkey / WebAuthn (FIDO2) - rpId/origin PHẢI cấp từ env (domain thật); khong hardcode localhost.
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'AgentCloud',
    rpId: process.env.WEBAUTHN_RP_ID || '',
    origin: process.env.WEBAUTHN_ORIGIN || '',
  },

  // Cấu hình dịch vụ gửi Mail (Đa hình: console / smtp)
  // SMTP_HOST khong co mac dinh hardcode — thieu thi SMTP transporter that qua trinh cau hinh
  // (SmtpMailSenderStrategy da bao dong warn + fail-soft), khong nam lap toi provider cua ben khac.
  mail: {
    strategy: process.env.MAIL_STRATEGY || 'console',
    from: process.env.MAIL_FROM || '',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },

  // Cấu hình Swagger OpenAPI UI
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path: process.env.SWAGGER_PATH || 'docs',
  },
});