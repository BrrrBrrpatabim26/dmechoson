-- Bảng 01: Tài khoản nhân viên (Nhân sự & Phân quyền)
CREATE TABLE IF NOT EXISTS tai_khoan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(30) NOT NULL COMMENT 'PHUC_VU, THU_NGAN, BEP, THU_KHO, QUAN_LY, CHU_QUAN',
    ma_pin_ca VARCHAR(60) COMMENT 'Mã PIN dùng để mở khóa nhanh trên thiết bị dùng chung',
    ma_duyet_hash VARCHAR(255) COMMENT 'Mã duyệt dành cho QUAN_LY khi duyệt hủy món/giảm giá',
    han_muc_giam_gia_phan_tram DECIMAL(5,2) DEFAULT 0.00 COMMENT 'BR-10: Hạn mức giảm giá tối đa không cần duyệt',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG' COMMENT 'HOAT_DONG, KHOA_CA, NGUNG_HOAT_DONG',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
