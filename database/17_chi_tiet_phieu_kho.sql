-- Bảng 17: Chi tiết biến động Phiếu Kho
CREATE TABLE IF NOT EXISTS chi_tiet_phieu_kho (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phieu_kho_id BIGINT NOT NULL,
    nguyen_lieu_id BIGINT NOT NULL,
    ton_truoc_bien_dong DECIMAL(15,3) NOT NULL,
    so_luong_thay_doi DECIMAL(15,3) NOT NULL COMMENT 'Dương (+) nếu nhập, Âm (-) nếu xuất/hao hụt',
    ton_sau_bien_dong DECIMAL(15,3) NOT NULL,
    dong_mon_id BIGINT NULL COMMENT 'Tham chiếu dòng món nếu là trừ kho tự động từ bếp',
    CONSTRAINT fk_ctkho_phieukho FOREIGN KEY (phieu_kho_id) REFERENCES phieu_kho(id),
    CONSTRAINT fk_ctkho_nguyenlieu FOREIGN KEY (nguyen_lieu_id) REFERENCES nguyen_lieu(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
