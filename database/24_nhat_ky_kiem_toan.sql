-- Bảng 24: Nhật ký kiểm toán toàn trình (BR-11: Audit Log bất biến, cấm xóa/sửa)
CREATE TABLE IF NOT EXISTS nhat_ky_kiem_toan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loai_doi_tuong VARCHAR(50) NOT NULL COMMENT 'BAN_AN, DON_HANG, DONG_MON, HOA_DON, PHIEU_DAT_BAN, KHO',
    doi_tuong_id BIGINT NOT NULL,
    hanh_dong VARCHAR(50) NOT NULL COMMENT 'THEM_MON, SUA_MON, HUY_MON, GIAM_GIA, THU_COC, HOAN_COC, MAT_COC, SUA_MUC_HET',
    du_lieu_cu JSON,
    du_lieu_moi JSON,
    ly_do TEXT,
    nguoi_thuc_hien_id BIGINT,
    nguoi_duyet_id BIGINT,
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kiemtoan_nguoithuchien FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_kiemtoan_nguoiduyet FOREIGN KEY (nguoi_duyet_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
