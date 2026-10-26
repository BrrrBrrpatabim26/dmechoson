-- Bảng 04: Cấu hình Điều khoản Nhà hàng 1-1 (BR-14: 9 trường cấu hình cọc & giữ bàn)
CREATE TABLE IF NOT EXISTS dieu_khoan_nha_hang (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    loai_coc_da_goi_mon VARCHAR(20) NOT NULL COMMENT 'SO_TIEN, PHAN_TRAM',
    muc_coc_da_goi_mon DECIMAL(15,2) NOT NULL COMMENT 'Trường 1: Mức cọc khi đã gọi món',
    loai_coc_chua_goi_mon VARCHAR(20) NOT NULL COMMENT 'SO_TIEN, PHAN_TRAM',
    muc_coc_chua_goi_mon DECIMAL(15,2) NOT NULL COMMENT 'Trường 2: Mức cọc khi chưa gọi món',
    thoi_han_huy_hoan_coc_phut INT NOT NULL COMMENT 'Trường 3: Thời hạn hủy được hoàn cọc (phút trước giờ đến)',
    thoi_han_huy_mat_coc_phut INT NOT NULL COMMENT 'Trường 4: Thời hạn hủy bị mất cọc (phút trước giờ đến)',
    muc_hoan_coc_phan_tram DECIMAL(5,2) NOT NULL COMMENT 'Trường 5: % hoàn cọc hợp lệ',
    muc_mat_coc_phan_tram DECIMAL(5,2) NOT NULL COMMENT 'Trường 6: % mất cọc khi vi phạm',
    thoi_gian_giu_ban_phut INT NOT NULL COMMENT 'Trường 7: Thời gian giữ bàn tối đa (phút)',
    cho_phep_gia_han BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Trường 8: Cho phép gia hạn giữ bàn hay không',
    phi_xu_ly_qua_gio DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Trường 9: Phí xử lý khi quá thời gian giữ bàn',
    nguoi_cap_nhat_id BIGINT NOT NULL,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dieukhoan_nguoicapnhat FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
