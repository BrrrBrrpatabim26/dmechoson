-- Bảng 22: Chi tiết dòng tính tiền trên từng Hóa đơn (Phục vụ tách hóa đơn)
CREATE TABLE IF NOT EXISTS chi_tiet_hoa_don (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hoa_don_id BIGINT NOT NULL,
    dong_mon_id BIGINT NOT NULL,
    so_luong_thanh_toan INT NOT NULL CHECK (so_luong_thanh_toan > 0) COMMENT 'Cho phép tách lẻ số lượng của 1 dòng món cho từng người trả',
    don_gia DECIMAL(15,2) NOT NULL,
    thanh_tien DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_cthoadon_hoadon FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id),
    CONSTRAINT fk_cthoadon_dongmon FOREIGN KEY (dong_mon_id) REFERENCES dong_mon(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
