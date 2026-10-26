import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  // Cổng là cấu hình phụ thuộc môi trường -> BẮT BUỘC cấp từ env, không default che thiếu (mục 6.1/6.3).
  PORT: Joi.number().port().required(),
  PORT_AUTO_INCREMENT: Joi.boolean().default(true),
  PORT_MAX_ATTEMPTS: Joi.number().min(1).max(200).default(20),
  APP_NAME: Joi.string().default('authentication service'),
  // CLIENT_URL là base URL dựng link magic-link/verify-email -> BẮT BUỘC cấp từ env, không default localhost (mục 5.1/5.4).
  CLIENT_URL: Joi.string().uri().required(),

  // Database
  DB_TYPE: Joi.string().valid('postgres', 'mysql').default('postgres'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_RUN_MIGRATIONS: Joi.boolean().default(false),
  DB_POOL_MAX: Joi.number().integer().min(1).default(20),
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_IDLE_MS: Joi.number().integer().min(0).default(30000),

  // JWT
  // JWT_SECRET là secret bắt buộc: không đặt default (mục 5.2/5.4). Thiếu thì dừng khởi động.
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: Joi.number().min(1).max(90).default(7),

  // Password Hashing
  HASH_DEFAULT_ALGORITHM: Joi.string().valid('argon2id', 'bcrypt').default('argon2id'),
  HASH_ARGON2_MEMORY_COST: Joi.number().default(65536),
  HASH_ARGON2_TIME_COST: Joi.number().default(3),
  HASH_ARGON2_PARALLELISM: Joi.number().default(1),
  HASH_BCRYPT_ROUNDS: Joi.number().min(8).max(16).default(12),

  // Swagger
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('docs'),

  // Mail & Auth Methods
  MAIL_STRATEGY: Joi.string().valid('console', 'smtp').default('console'),
  MAIL_FROM: Joi.string().default('noreply@agent-cloud.io'),
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().port().allow('').optional(),
  SMTP_SECURE: Joi.boolean().allow('').optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  AUTH_ENABLED_METHODS: Joi.string().allow('').optional(),
  AUTH_EMAIL_VERIFICATION_ENABLED: Joi.boolean().default(false),
  AUTH_RBAC_CACHE_TTL_MS: Joi.number().min(0).default(60000),
  // csv email admin bootstrap; mac dinh rong = tat duong grant SUPER_ADMIN luc boot.
  ADMIN_BOOTSTRAP_EMAILS: Joi.string().allow('').optional(),
  // csv ten role toan quyen (khong hard-code trong code); mac dinh SUPER_ADMIN.
  SUPER_ADMIN_ROLES: Joi.string().allow('').default('SUPER_ADMIN'),
  // ten role mac dinh cap cho user moi; phai ton tai trong bang roles (bootstrap seed lo).
  DEFAULT_USER_ROLE: Joi.string().allow('').default('USER'),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().min(1000).default(60000),
  THROTTLE_LIMIT: Joi.number().min(1).default(20),

  // OAuth 2.0 (Google / GitHub) - tuy chon, chi bat khi co credentials that
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().allow('').optional(),
  GITHUB_CLIENT_ID: Joi.string().allow('').optional(),
  GITHUB_CLIENT_SECRET: Joi.string().allow('').optional(),
  GITHUB_CALLBACK_URL: Joi.string().uri().allow('').optional(),

  // MFA / TOTP
  MFA_ISSUER: Joi.string().default('AgentCloud Auth'),
  MFA_RECOVERY_CODE_COUNT: Joi.number().min(4).max(20).default(8),
  MFA_ENCRYPTION_KEY: Joi.string().allow('').optional(),

  // Passkey / WebAuthn
  WEBAUTHN_RP_NAME: Joi.string().default('AgentCloud'),
  WEBAUTHN_RP_ID: Joi.string().allow('').optional(),
  WEBAUTHN_ORIGIN: Joi.string().allow('').optional(),

  // Redis (bat/tat qua ON_REDIS). env UU TIEN hon config.yaml
  ON_REDIS: Joi.boolean().default(false),
  REDIS_URL: Joi.string().allow('').optional(),
  REDIS_HOST: Joi.string().allow('').optional(),
  REDIS_PORT: Joi.number().port().allow('').optional(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).allow('').optional(),

  // Cứng hóa bảo mật / vận hành (tất cả optional, mặc định an toàn trong code)
  TRUST_PROXY: Joi.string().allow('').optional(),
  CORS_ORIGIN: Joi.string().allow('').optional(),
  // S3: state CSRF cho OAuth BAT MAC DINH (luu KV + cookie httpOnly, khong can express-session).
  // Chi tat khi cap OAUTH_STATE=false (opt-out tuong minh, vi du demo khong round-trip provider that).
  OAUTH_STATE: Joi.boolean().default(true),
  SMTP_TLS_INSECURE: Joi.boolean().default(false),
  SMTP_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),
  DB_POOL_CONNECT_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  HTTP_KEEPALIVE_TIMEOUT_MS: Joi.number().integer().min(1000).default(65000),
});