-- Bảng 11: Món ăn trong thực đơn
CREATE TABLE IF NOT EXISTS mon_an (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_mon VARCHAR(30) NOT NULL UNIQUE,
    ten_mon VARCHAR(150) NOT NULL,
    mo_ta TEXT,
    hinh_anh_url VARCHAR(500),
    danh_muc_id BIGINT NOT NULL,
    gia_hien_hanh DECIMAL(15,2) NOT NULL CHECK (gia_hien_hanh >= 0),
    quay_che_bien VARCHAR(30) NOT NULL COMMENT 'BEP_NONG, BEP_LANH, QUAY_PHA_CHE, PHUC_VU_NGAY',
    can_qua_bep BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'BR-03: Trừ món phục vụ ngay không cần qua bếp',
    thoi_gian_che_bien_phut INT DEFAULT 10 COMMENT 'Dùng để tính độ ưu tiên món lâu ở hàng đợi bếp',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CON_BAN' COMMENT 'CON_BAN, TAM_HET, NGUNG_BAN',
    ly_do_khoa VARCHAR(255),
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_monan_danhmuc FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
