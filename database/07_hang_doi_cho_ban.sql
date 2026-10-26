-- Bảng 07: Hàng đợi chờ bàn (Khi nhà hàng hết bàn trống)
CREATE TABLE IF NOT EXISTS hang_doi_cho_ban (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_khach VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    so_nguoi INT NOT NULL,
    khu_vuc_mong_muon_id BIGINT,
    gio_ghi_nhan TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gio_hen_du_kien TIMESTAMP NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_CHO' COMMENT 'DANG_CHO, DA_XEP_BAN, DA_HUY_CHO',
    CONSTRAINT fk_hangdoi_khuvuc FOREIGN KEY (khu_vuc_mong_muon_id) REFERENCES khu_vuc(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
