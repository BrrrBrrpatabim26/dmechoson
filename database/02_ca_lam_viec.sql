-- Bảng 02: Ca làm việc / Ca bán hàng (Chốt ca & Đối soát tiền mặt)
CREATE TABLE IF NOT EXISTS ca_lam_viec (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nguoi_mo_ca_id BIGINT NOT NULL,
    nguoi_chot_ca_id BIGINT,
    gio_mo_ca TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gio_dong_ca TIMESTAMP NULL,
    tien_dau_ca DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tong_thu_tien_mat_he_thong DECIMAL(15,2) DEFAULT 0.00,
    tong_thu_chuyen_khoan_he_thong DECIMAL(15,2) DEFAULT 0.00,
    tien_mat_kiem_dem_lan_1 DECIMAL(15,2),
    tien_mat_kiem_dem_lan_2 DECIMAL(15,2) COMMENT 'Luồng lỗi: Yêu cầu kiểm đếm 2 lần nếu lệch',
    chenh_lech DECIMAL(15,2) DEFAULT 0.00,
    ly_do_chenh_lech TEXT COMMENT 'BR-08: Biên bản lệch tiền mặt',
    quan_ly_xac_nhan_lech_id BIGINT COMMENT 'BR-08: Người xác nhận biên bản lệch',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_MO' COMMENT 'DANG_MO, DA_KHOA',
    version INT NOT NULL DEFAULT 0 COMMENT 'BR-17: Chống 2 thu ngân bấm chốt cùng 1 ca',
    CONSTRAINT fk_ca_nguoi_mo FOREIGN KEY (nguoi_mo_ca_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_ca_nguoi_chot FOREIGN KEY (nguoi_chot_ca_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_ca_ql_xac_nhan FOREIGN KEY (quan_ly_xac_nhan_lech_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
