-- Bảng 18: Đơn hàng phục vụ tại bàn (BR-01, BR-02)
CREATE TABLE IF NOT EXISTS don_hang (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_don VARCHAR(30) NOT NULL UNIQUE,
    ban_id BIGINT NOT NULL,
    ca_lam_viec_id BIGINT NOT NULL,
    phieu_dat_ban_id BIGINT UNIQUE COMMENT 'Gắn phiếu đặt trước để khấu trừ cọc khi thanh toán',
    nguoi_mo_don_id BIGINT NOT NULL,
    gio_mo_don TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gio_dong_don TIMESTAMP NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'MOI_MO' COMMENT 'MOI_MO, DANG_PHUC_VU, CHO_THANH_TOAN, DA_THANH_TOAN, DA_HUY',
    ly_do_huy_don TEXT COMMENT 'Khi khách đổi ý hủy cả đơn trước khi bếp làm (Bước 32)',
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_donhang_ban FOREIGN KEY (ban_id) REFERENCES ban_an(id),
    CONSTRAINT fk_donhang_ca FOREIGN KEY (ca_lam_viec_id) REFERENCES ca_lam_viec(id),
    CONSTRAINT fk_donhang_phieudat FOREIGN KEY (phieu_dat_ban_id) REFERENCES phieu_dat_ban(id),
    CONSTRAINT fk_donhang_nguoimo FOREIGN KEY (nguoi_mo_don_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
