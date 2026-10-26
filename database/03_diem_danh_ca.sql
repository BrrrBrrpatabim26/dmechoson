-- Bảng 03: Điểm danh nhân sự trong ca
CREATE TABLE IF NOT EXISTS diem_danh_ca (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ca_lam_viec_id BIGINT NOT NULL,
    tai_khoan_id BIGINT NOT NULL,
    gio_vao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gio_ra TIMESTAMP NULL,
    CONSTRAINT fk_diemdanh_ca FOREIGN KEY (ca_lam_viec_id) REFERENCES ca_lam_viec(id),
    CONSTRAINT fk_diemdanh_taikhoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
