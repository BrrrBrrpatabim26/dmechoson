-- Bảng 23: Giao dịch thanh toán của Hóa đơn (Tiền mặt, Chuyển khoản, Thẻ, Ví)
CREATE TABLE IF NOT EXISTS giao_dich_thanh_toan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hoa_don_id BIGINT NOT NULL,
    phuong_thuc VARCHAR(30) NOT NULL COMMENT 'TIEN_MAT, CHUYEN_KHOAN, THE, VI_DIEN_TU',
    so_tien DECIMAL(15,2) NOT NULL CHECK (so_tien > 0),
    ma_tham_chieu_ngan_hang VARCHAR(100),
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gdthanhtoan_hoadon FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
