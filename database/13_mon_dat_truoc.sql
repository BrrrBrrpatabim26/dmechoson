-- Bảng 13: Danh sách món đặt trước kèm Phiếu đặt bàn qua App
CREATE TABLE IF NOT EXISTS mon_dat_truoc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phieu_dat_ban_id BIGINT NOT NULL,
    mon_an_id BIGINT NOT NULL,
    so_luong INT NOT NULL CHECK (so_luong > 0),
    gia_du_kien DECIMAL(15,2) NOT NULL,
    ghi_chu VARCHAR(255),
    CONSTRAINT fk_mondattruoc_phieudat FOREIGN KEY (phieu_dat_ban_id) REFERENCES phieu_dat_ban(id),
    CONSTRAINT fk_mondattruoc_monan FOREIGN KEY (mon_an_id) REFERENCES mon_an(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
