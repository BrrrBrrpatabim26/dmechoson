-- V1: users + tokens (MySQL 8, ULID CHAR(26))
CREATE TABLE IF NOT EXISTS users (
  id CHAR(26) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  email_verified_at DATETIME(6) NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  lock_until DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT ck_users_status CHECK (status IN ('PENDING','ACTIVE','LOCKED')),
  CONSTRAINT ux_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX ix_users_status ON users (status);

CREATE TABLE IF NOT EXISTS verify_tokens (
  token VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_verify_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_hash VARCHAR(128) NOT NULL PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Outbox cho Kafka exactly-once (optional, dùng khi bật outbox pattern)
CREATE TABLE IF NOT EXISTS outbox (
  id CHAR(26) NOT NULL PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  message_key VARCHAR(255) NOT NULL,
  payload JSON NOT NULL,
  headers JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  published_at DATETIME(6) NULL,
  INDEX ix_outbox_unpublished (published_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
