-- Bảng 19: Phiếu chế biến tại Bếp (Nhóm món theo quầy bếp nóng/lạnh/pha chế)
CREATE TABLE IF NOT EXISTS phieu_bep (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_phieu_bep VARCHAR(30) NOT NULL UNIQUE,
    don_hang_id BIGINT NOT NULL,
    quay_che_bien VARCHAR(30) NOT NULL COMMENT 'BEP_NONG, BEP_LANH, QUAY_PHA_CHE',
    muc_do_uu_tien INT NOT NULL DEFAULT 1 COMMENT 'Ưu tiên bàn đông hoặc món làm lâu',
    thoi_gian_gui TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nguoi_xac_nhan_bep_id BIGINT,
    thoi_gian_xac_nhan TIMESTAMP NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'CHO_XAC_NHAN' COMMENT 'CHO_XAC_NHAN, DANG_CHE_BIEN, HOAN_TAT',
    CONSTRAINT fk_phieubep_donhang FOREIGN KEY (don_hang_id) REFERENCES don_hang(id),
    CONSTRAINT fk_phieubep_nguoixacnhan FOREIGN KEY (nguoi_xac_nhan_bep_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
