-- Bảng 15: Định mức nguyên liệu / Công thức món ăn (BOM)
CREATE TABLE IF NOT EXISTS dinh_muc_nguyen_lieu (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mon_an_id BIGINT NOT NULL,
    nguyen_lieu_id BIGINT NOT NULL,
    so_luong_hao_hut DECIMAL(15,3) NOT NULL CHECK (so_luong_hao_hut > 0),
    UNIQUE KEY uk_mon_nguyenlieu (mon_an_id, nguyen_lieu_id),
    CONSTRAINT fk_dinhmuc_monan FOREIGN KEY (mon_an_id) REFERENCES mon_an(id),
    CONSTRAINT fk_dinhmuc_nguyenlieu FOREIGN KEY (nguyen_lieu_id) REFERENCES nguyen_lieu(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
