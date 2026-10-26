-- Bảng 14: Nguyên liệu tồn kho (BR-07, BR-18)
CREATE TABLE IF NOT EXISTS nguyen_lieu (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_nguyen_lieu VARCHAR(30) NOT NULL UNIQUE,
    ten_nguyen_lieu VARCHAR(150) NOT NULL,
    don_vi_tinh VARCHAR(30) NOT NULL COMMENT 'gram, ml, quả, lon...',
    ton_hien_tai DECIMAL(15,3) NOT NULL DEFAULT 0.000 CHECK (ton_hien_tai >= 0),
    muc_het_canh_bao DECIMAL(15,3) NOT NULL DEFAULT 0.000 COMMENT 'BR-18: Thủ kho đặt mức hết',
    da_gui_canh_bao_het BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'BR-18: Chạm mức chỉ báo 1 lần, nhập vượt mức mới reset về FALSE',
    nguoi_sua_muc_het_id BIGINT,
    thoi_gian_sua_muc_het TIMESTAMP NULL,
    version INT NOT NULL DEFAULT 0 COMMENT 'BR-17: Chống trừ kho âm khi 2 món cùng hoàn thành',
    CONSTRAINT fk_nguyenlieu_nguoisua FOREIGN KEY (nguoi_sua_muc_het_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
