-- Bảng 06: Bàn ăn (Quản lý sơ đồ bàn & trạng thái bàn)
CREATE TABLE IF NOT EXISTS ban_an (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_ban VARCHAR(20) NOT NULL UNIQUE,
    ten_hien_thi VARCHAR(50) NOT NULL,
    khu_vuc_id BIGINT NOT NULL,
    suc_chua INT NOT NULL CHECK (suc_chua > 0),
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'TRONG' COMMENT 'TRONG, DA_DAT_TRUOC, DANG_PHUC_VU, DANG_DON_DEP, TAM_NGUNG',
    version INT NOT NULL DEFAULT 0 COMMENT 'BR-17: Khóa lạc quan chống mở trùng đơn / xếp trùng bàn',
    CONSTRAINT fk_ban_khuvuc FOREIGN KEY (khu_vuc_id) REFERENCES khu_vuc(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
