-- Bảng 09: Lịch sử giao dịch Cọc (BR-15: Kiểm toán thu, khấu trừ, hoàn, mất cọc)
CREATE TABLE IF NOT EXISTS giao_dich_coc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phieu_dat_ban_id BIGINT NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL UNIQUE COMMENT 'Chống thu cọc 2 lần hoặc hoàn/mất cọc đè nhau',
    loai_giao_dich VARCHAR(30) NOT NULL COMMENT 'THU_COC, KHAU_TRU_HOA_DON, HOAN_COC, MAT_COC, THU_PHI_QUA_GIO',
    so_tien DECIMAL(15,2) NOT NULL,
    ly_do TEXT,
    nguoi_thuc_hien_id BIGINT COMMENT 'NULL nếu hệ thống tự động xử lý quá giờ qua RabbitMQ',
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gdcoc_phieudat FOREIGN KEY (phieu_dat_ban_id) REFERENCES phieu_dat_ban(id),
    CONSTRAINT fk_gdcoc_nguoithuchien FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
