-- Bảng 16: Phiếu Kho (Nhập kho, Xuất bán hàng, Kiểm kê điều chỉnh)
CREATE TABLE IF NOT EXISTS phieu_kho (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_phieu VARCHAR(30) NOT NULL UNIQUE,
    loai_phieu VARCHAR(30) NOT NULL COMMENT 'NHAP_KHO, XUAT_BAN_HANG, KIEM_KE_DIEU_CHINH',
    nguoi_tao_id BIGINT NOT NULL,
    nguoi_xac_nhan_id BIGINT COMMENT 'Quản lý xác nhận khi kiểm kê chênh lệch',
    ly_do TEXT COMMENT 'Bắt buộc khi điều chỉnh kiểm kê',
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_phieukho_nguoitao FOREIGN KEY (nguoi_tao_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_phieukho_nguoixacnhan FOREIGN KEY (nguoi_xac_nhan_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
