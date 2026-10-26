-- Bảng 26: Chống xử lý trùng sự kiện đến (Idempotent Consumer - BR-16)
CREATE TABLE IF NOT EXISTS su_kien_da_xu_ly (
    ma_su_kien VARCHAR(64) PRIMARY KEY COMMENT 'Mã sự kiện từ RabbitMQ/Kafka đã xử lý thành công',
    ten_consumer VARCHAR(100) NOT NULL,
    thoi_gian_xu_ly TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
