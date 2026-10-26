-- Bảng 25: Hộp thư sự kiện đi (Transactional Outbox cho RabbitMQ & Kafka - BR-12, BR-16)
CREATE TABLE IF NOT EXISTS hop_thu_su_kien_di (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_su_kien VARCHAR(64) NOT NULL UNIQUE COMMENT 'UUID dùng để chống trùng phía Consumer',
    kenh_dich VARCHAR(20) NOT NULL COMMENT 'RABBITMQ, KAFKA',
    routing_key_hoac_topic VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_GUI' COMMENT 'CHO_GUI, DA_GUI, LOI_DEAD_LETTER',
    so_lan_thu_lai INT NOT NULL DEFAULT 0,
    loi_chi_tiet TEXT,
    thoi_gian_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_gui TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
