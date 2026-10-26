-- Bảng 05: Khu vực bàn ăn
CREATE TABLE IF NOT EXISTS khu_vuc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_khu_vuc VARCHAR(100) NOT NULL,
    thu_tu_hien_thi INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
