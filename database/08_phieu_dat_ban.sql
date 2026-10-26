-- Bảng 08: Phiếu đặt bàn trước qua App (BR-09, BR-13)
CREATE TABLE IF NOT EXISTS phieu_dat_ban (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_phieu VARCHAR(30) NOT NULL UNIQUE COMMENT 'Dùng làm khóa lũy đẳng thu cọc',
    ten_khach VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    so_nguoi INT NOT NULL,
    ban_id BIGINT NOT NULL,
    gio_den_hen TIMESTAMP NOT NULL,
    han_giu_ban TIMESTAMP NOT NULL COMMENT 'Tính từ gio_den_hen + thoi_gian_giu_ban_phut',
    da_gia_han BOOLEAN NOT NULL DEFAULT FALSE,
    co_goi_mon_truoc BOOLEAN NOT NULL DEFAULT FALSE,
    so_tien_coc_yeu_cau DECIMAL(15,2) NOT NULL,
    so_tien_coc_da_thu DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'CHO_THU_COC' COMMENT 'CHO_THU_COC, DANG_GIU_CHO, KHACH_DA_DEN, DA_HUY_HOAN_COC, DA_HUY_MAT_COC, QUA_GIO_MAT_COC',
    version INT NOT NULL DEFAULT 0 COMMENT 'Chống đua giữa luồng Khách đến và luồng Quá giờ tự động',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_phieudat_ban FOREIGN KEY (ban_id) REFERENCES ban_an(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
