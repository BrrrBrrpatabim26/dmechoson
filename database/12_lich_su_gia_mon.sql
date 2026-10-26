-- Bảng 12: Bảng giá theo thời điểm (BR-06: Lưu vết đổi giá)
CREATE TABLE IF NOT EXISTS lich_su_gia_mon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mon_an_id BIGINT NOT NULL,
    gia_ap_dung DECIMAL(15,2) NOT NULL,
    tu_thoi_diem TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    den_thoi_diem TIMESTAMP NULL COMMENT 'NULL là bản giá đang có hiệu lực',
    nguoi_cap_nhat_id BIGINT NOT NULL,
    CONSTRAINT fk_lichsugia_monan FOREIGN KEY (mon_an_id) REFERENCES mon_an(id),
    CONSTRAINT fk_lichsugia_nguoicapnhat FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
