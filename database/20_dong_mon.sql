-- Bảng 20: Dòng món trong đơn hàng (BR-03, BR-04, BR-05, BR-06)
CREATE TABLE IF NOT EXISTS dong_mon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    don_hang_id BIGINT NOT NULL,
    phieu_bep_id BIGINT COMMENT 'NULL nếu là món phục vụ ngay không qua bếp',
    mon_an_id BIGINT NOT NULL,
    lich_su_gia_id BIGINT NOT NULL COMMENT 'BR-06: Đối chiếu bản giá tại thời điểm gọi',
    so_luong INT NOT NULL CHECK (so_luong > 0),
    gia_chot DECIMAL(15,2) NOT NULL COMMENT 'BR-06: Giá chốt cứng lúc gọi món',
    ghi_chu_che_bien VARCHAR(255),
    trang_thai_che_bien VARCHAR(30) NOT NULL DEFAULT 'CHO_BEP_XAC_NHAN' COMMENT 'CHO_BEP_XAC_NHAN, DANG_CHE_BIEN, DA_HOAN_THANH, DA_PHUC_VU, CHO_DUYET_HUY, DA_HUY_CO_DUYET, DA_HUY_TRUOC_BEP',
    ly_do_huy TEXT COMMENT 'BR-04: Lý do hủy món',
    nguoi_yeu_cau_huy_id BIGINT,
    quan_ly_duyet_huy_id BIGINT COMMENT 'BR-04: Quản lý duyệt hủy sau khi bếp đã nhận',
    thoi_gian_goi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_hoan_thanh TIMESTAMP NULL,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_dongmon_donhang FOREIGN KEY (don_hang_id) REFERENCES don_hang(id),
    CONSTRAINT fk_dongmon_phieubep FOREIGN KEY (phieu_bep_id) REFERENCES phieu_bep(id),
    CONSTRAINT fk_dongmon_monan FOREIGN KEY (mon_an_id) REFERENCES mon_an(id),
    CONSTRAINT fk_dongmon_lichsugia FOREIGN KEY (lich_su_gia_id) REFERENCES lich_su_gia_mon(id),
    CONSTRAINT fk_dongmon_nguoiyeucauhuy FOREIGN KEY (nguoi_yeu_cau_huy_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_dongmon_qlduyethuy FOREIGN KEY (quan_ly_duyet_huy_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
