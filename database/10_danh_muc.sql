-- Bảng 10: Danh mục thực đơn
CREATE TABLE IF NOT EXISTS danh_muc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL,
    thu_tu_hien_thi INT NOT NULL DEFAULT 0,
    gio_bat_dau_ban TIME COMMENT 'Khung giờ áp dụng (VD: Thực đơn sáng)',
    gio_ket_thuc_ban TIME,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
