-- FILE TỔNG HỢP TOÀN BỘ 26 BẢNG CƠ SỞ DỮ LIỆU QUẢN LÝ NHÀ HÀNG
CREATE DATABASE IF NOT EXISTS restaurant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurant_db;

-- Bảng 01: Tài khoản nhân viên (Nhân sự & Phân quyền)
CREATE TABLE IF NOT EXISTS tai_khoan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(30) NOT NULL COMMENT 'PHUC_VU, THU_NGAN, BEP, THU_KHO, QUAN_LY, CHU_QUAN',
    ma_pin_ca VARCHAR(60) COMMENT 'Mã PIN dùng để mở khóa nhanh trên thiết bị dùng chung',
    ma_duyet_hash VARCHAR(255) COMMENT 'Mã duyệt dành cho QUAN_LY khi duyệt hủy món/giảm giá',
    han_muc_giam_gia_phan_tram DECIMAL(5,2) DEFAULT 0.00 COMMENT 'BR-10: Hạn mức giảm giá tối đa không cần duyệt',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG' COMMENT 'HOAT_DONG, KHOA_CA, NGUNG_HOAT_DONG',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 02: Ca làm việc / Ca bán hàng (Chốt ca & Đối soát tiền mặt)
CREATE TABLE IF NOT EXISTS ca_lam_viec (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nguoi_mo_ca_id BIGINT NOT NULL,
    nguoi_chot_ca_id BIGINT,
    gio_mo_ca TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gio_dong_ca TIMESTAMP NULL,
    tien_dau_ca DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tong_thu_tien_mat_he_thong DECIMAL(15,2) DEFAULT 0.00,
    tong_thu_chuyen_khoan_he_thong DECIMAL(15,2) DEFAULT 0.00,
    tien_mat_kiem_dem_lan_1 DECIMAL(15,2),
    tien_mat_kiem_dem_lan_2 DECIMAL(15,2) COMMENT 'Luồng lỗi: Yêu cầu kiểm đếm 2 lần nếu lệch',
    chenh_lech DECIMAL(15,2) DEFAULT 0.00,
    ly_do_chenh_lech TEXT COMMENT 'BR-08: Biên bản lệch tiền mặt',
    quan_ly_xac_nhan_lech_id BIGINT COMMENT 'BR-08: Người xác nhận biên bản lệch',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_MO' COMMENT 'DANG_MO, DA_KHOA',
    version INT NOT NULL DEFAULT 0 COMMENT 'BR-17: Chống 2 thu ngân bấm chốt cùng 1 ca',
    CONSTRAINT fk_ca_nguoi_mo FOREIGN KEY (nguoi_mo_ca_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_ca_nguoi_chot FOREIGN KEY (nguoi_chot_ca_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_ca_ql_xac_nhan FOREIGN KEY (quan_ly_xac_nhan_lech_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng 04: Cấu hình Điều khoản Nhà hàng 1-1 (BR-14: 9 trường cấu hình cọc & giữ bàn)
CREATE TABLE IF NOT EXISTS dieu_khoan_nha_hang (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    loai_coc_da_goi_mon VARCHAR(20) NOT NULL COMMENT 'SO_TIEN, PHAN_TRAM',
    muc_coc_da_goi_mon DECIMAL(15,2) NOT NULL COMMENT 'Trường 1: Mức cọc khi đã gọi món',
    loai_coc_chua_goi_mon VARCHAR(20) NOT NULL COMMENT 'SO_TIEN, PHAN_TRAM',
    muc_coc_chua_goi_mon DECIMAL(15,2) NOT NULL COMMENT 'Trường 2: Mức cọc khi chưa gọi món',
    thoi_han_huy_hoan_coc_phut INT NOT NULL COMMENT 'Trường 3: Thời hạn hủy được hoàn cọc (phút trước giờ đến)',
    thoi_han_huy_mat_coc_phut INT NOT NULL COMMENT 'Trường 4: Thời hạn hủy bị mất cọc (phút trước giờ đến)',
    muc_hoan_coc_phan_tram DECIMAL(5,2) NOT NULL COMMENT 'Trường 5: % hoàn cọc hợp lệ',
    muc_mat_coc_phan_tram DECIMAL(5,2) NOT NULL COMMENT 'Trường 6: % mất cọc khi vi phạm',
    thoi_gian_giu_ban_phut INT NOT NULL COMMENT 'Trường 7: Thời gian giữ bàn tối đa (phút)',
    cho_phep_gia_han BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Trường 8: Cho phép gia hạn giữ bàn hay không',
    phi_xu_ly_qua_gio DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Trường 9: Phí xử lý khi quá thời gian giữ bàn',
    nguoi_cap_nhat_id BIGINT NOT NULL,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dieukhoan_nguoicapnhat FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 05: Khu vực bàn ăn
CREATE TABLE IF NOT EXISTS khu_vuc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_khu_vuc VARCHAR(100) NOT NULL,
    thu_tu_hien_thi INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 06: Bàn ăn (Quản lý sơ đồ bàn & trạng thái bàn)
CREATE TABLE IF NOT EXISTS ban_an (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_ban VARCHAR(20) NOT NULL UNIQUE,
    ten_hien_thi VARCHAR(50) NOT NULL,
    khu_vuc_id BIGINT NOT NULL,
    suc_chua INT NOT NULL CHECK (suc_chua > 0),
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'TRONG' COMMENT 'TRONG, DA_DAT_TRUOC, DANG_PHUC_VU, DANG_DON_DEP, TAM_NGUNG',
    version INT NOT NULL DEFAULT 0 COMMENT 'BR-17: Khóa lạc quan chống mở trùng đơn / xếp trùng bàn',
    CONSTRAINT fk_ban_khuvuc FOREIGN KEY (khu_vuc_id) REFERENCES khu_vuc(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 07: Hàng đợi chờ bàn (Khi nhà hàng hết bàn trống)
CREATE TABLE IF NOT EXISTS hang_doi_cho_ban (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_khach VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    so_nguoi INT NOT NULL,
    khu_vuc_mong_muon_id BIGINT,
    gio_ghi_nhan TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gio_hen_du_kien TIMESTAMP NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_CHO' COMMENT 'DANG_CHO, DA_XEP_BAN, DA_HUY_CHO',
    CONSTRAINT fk_hangdoi_khuvuc FOREIGN KEY (khu_vuc_mong_muon_id) REFERENCES khu_vuc(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 08: Phiếu đặt bàn trước qua App (BR-09, BR-13)
CREATE TABLE IF NOT EXISTS phieu_dat_ban (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_phieu VARCHAR(30) NOT NULL UNIQUE COMMENT 'Dùng làm khóa lũy đẳng thu cọc',
    ten_khach VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    so_nguoi INT NOT NULL,
    ban_id BIGINT NOT NULL,
    gio_den_hen TIMESTAMP NOT NULL,
    han_giu_ban TIMESTAMP NOT NULL COMMENT 'Tính từ gio_den_hen + thoi_gian_giu_ban_phut',
    da_gia_han BOOLEAN NOT NULL DEFAULT FALSE,
    co_goi_mon_truoc BOOLEAN NOT NULL DEFAULT FALSE,
    so_tien_coc_yeu_cau DECIMAL(15,2) NOT NULL,
    so_tien_coc_da_thu DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'CHO_THU_COC' COMMENT 'CHO_THU_COC, DANG_GIU_CHO, KHACH_DA_DEN, DA_HUY_HOAN_COC, DA_HUY_MAT_COC, QUA_GIO_MAT_COC',
    version INT NOT NULL DEFAULT 0 COMMENT 'Chống đua giữa luồng Khách đến và luồng Quá giờ tự động',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_phieudat_ban FOREIGN KEY (ban_id) REFERENCES ban_an(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng 10: Danh mục thực đơn
CREATE TABLE IF NOT EXISTS danh_muc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL,
    thu_tu_hien_thi INT NOT NULL DEFAULT 0,
    gio_bat_dau_ban TIME COMMENT 'Khung giờ áp dụng (VD: Thực đơn sáng)',
    gio_ket_thuc_ban TIME,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 11: Món ăn trong thực đơn
CREATE TABLE IF NOT EXISTS mon_an (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_mon VARCHAR(30) NOT NULL UNIQUE,
    ten_mon VARCHAR(150) NOT NULL,
    mo_ta TEXT,
    hinh_anh_url VARCHAR(500),
    danh_muc_id BIGINT NOT NULL,
    gia_hien_hanh DECIMAL(15,2) NOT NULL CHECK (gia_hien_hanh >= 0),
    quay_che_bien VARCHAR(30) NOT NULL COMMENT 'BEP_NONG, BEP_LANH, QUAY_PHA_CHE, PHUC_VU_NGAY',
    can_qua_bep BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'BR-03: Trừ món phục vụ ngay không cần qua bếp',
    thoi_gian_che_bien_phut INT DEFAULT 10 COMMENT 'Dùng để tính độ ưu tiên món lâu ở hàng đợi bếp',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CON_BAN' COMMENT 'CON_BAN, TAM_HET, NGUNG_BAN',
    ly_do_khoa VARCHAR(255),
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_monan_danhmuc FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng 14: Nguyên liệu tồn kho (BR-07, BR-18)
CREATE TABLE IF NOT EXISTS nguyen_lieu (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_nguyen_lieu VARCHAR(30) NOT NULL UNIQUE,
    ten_nguyen_lieu VARCHAR(150) NOT NULL,
    don_vi_tinh VARCHAR(30) NOT NULL COMMENT 'gram, ml, quả, lon...',
    ton_hien_tai DECIMAL(15,3) NOT NULL DEFAULT 0.000 CHECK (ton_hien_tai >= 0),
    muc_het_canh_bao DECIMAL(15,3) NOT NULL DEFAULT 0.000 COMMENT 'BR-18: Thủ kho đặt mức hết',
    da_gui_canh_bao_het BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'BR-18: Chạm mức chỉ báo 1 lần, nhập vượt mức mới reset về FALSE',
    nguoi_sua_muc_het_id BIGINT,
    thoi_gian_sua_muc_het TIMESTAMP NULL,
    version INT NOT NULL DEFAULT 0 COMMENT 'BR-17: Chống trừ kho âm khi 2 món cùng hoàn thành',
    CONSTRAINT fk_nguyenlieu_nguoisua FOREIGN KEY (nguoi_sua_muc_het_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 15: Định mức nguyên liệu / Công thức món ăn (BOM)
CREATE TABLE IF NOT EXISTS dinh_muc_nguyen_lieu (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mon_an_id BIGINT NOT NULL,
    nguyen_lieu_id BIGINT NOT NULL,
    so_luong_hao_hut DECIMAL(15,3) NOT NULL CHECK (so_luong_hao_hut > 0),
    UNIQUE KEY uk_mon_nguyenlieu (mon_an_id, nguyen_lieu_id),
    CONSTRAINT fk_dinhmuc_monan FOREIGN KEY (mon_an_id) REFERENCES mon_an(id),
    CONSTRAINT fk_dinhmuc_nguyenlieu FOREIGN KEY (nguyen_lieu_id) REFERENCES nguyen_lieu(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 16: Phiếu Kho (Nhập kho, Xuất bán hàng, Kiểm kê điều chỉnh)
CREATE TABLE IF NOT EXISTS phieu_kho (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_phieu VARCHAR(30) NOT NULL UNIQUE,
    loai_phieu VARCHAR(30) NOT NULL COMMENT 'NHAP_KHO, XUAT_BAN_HANG, KIEM_KE_DIEU_CHINH',
    nguoi_tao_id BIGINT NOT NULL,
    nguoi_xac_nhan_id BIGINT COMMENT 'Quản lý xác nhận khi kiểm kê chênh lệch',
    ly_do TEXT COMMENT 'Bắt buộc khi điều chỉnh kiểm kê',
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_phieukho_nguoitao FOREIGN KEY (nguoi_tao_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_phieukho_nguoixacnhan FOREIGN KEY (nguoi_xac_nhan_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng 18: Đơn hàng phục vụ tại bàn (BR-01, BR-02)
CREATE TABLE IF NOT EXISTS don_hang (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_don VARCHAR(30) NOT NULL UNIQUE,
    ban_id BIGINT NOT NULL,
    ca_lam_viec_id BIGINT NOT NULL,
    phieu_dat_ban_id BIGINT UNIQUE COMMENT 'Gắn phiếu đặt trước để khấu trừ cọc khi thanh toán',
    nguoi_mo_don_id BIGINT NOT NULL,
    gio_mo_don TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gio_dong_don TIMESTAMP NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'MOI_MO' COMMENT 'MOI_MO, DANG_PHUC_VU, CHO_THANH_TOAN, DA_THANH_TOAN, DA_HUY',
    ly_do_huy_don TEXT COMMENT 'Khi khách đổi ý hủy cả đơn trước khi bếp làm (Bước 32)',
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_donhang_ban FOREIGN KEY (ban_id) REFERENCES ban_an(id),
    CONSTRAINT fk_donhang_ca FOREIGN KEY (ca_lam_viec_id) REFERENCES ca_lam_viec(id),
    CONSTRAINT fk_donhang_phieudat FOREIGN KEY (phieu_dat_ban_id) REFERENCES phieu_dat_ban(id),
    CONSTRAINT fk_donhang_nguoimo FOREIGN KEY (nguoi_mo_don_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng 21: Hóa đơn thanh toán (Hỗ trợ tách hóa đơn con từ đơn gốc)
CREATE TABLE IF NOT EXISTS hoa_don (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_hoa_don VARCHAR(30) NOT NULL UNIQUE,
    idempotency_key VARCHAR(64) NOT NULL UNIQUE COMMENT 'BR-17: Khóa lũy đẳng chống chốt hóa đơn 2 lần',
    don_hang_id BIGINT NOT NULL,
    ca_lam_viec_id BIGINT NOT NULL,
    thu_ngan_id BIGINT NOT NULL,
    la_hoa_don_tach BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'TRUE nếu được tách ra từ đơn gốc',
    tong_tien_mon DECIMAL(15,2) NOT NULL,
    ti_le_giam_gia DECIMAL(5,2) DEFAULT 0.00,
    so_tien_giam_gia DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ly_do_giam_gia VARCHAR(255),
    quan_ly_duyet_giam_gia_id BIGINT COMMENT 'BR-10: Bắt buộc nếu vượt hạn mức nhân viên',
    tien_thue_vat DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    phi_phuc_vu DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tien_coc_khau_tru DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Khấu trừ từ phieu_dat_ban',
    tong_phai_thu DECIMAL(15,2) NOT NULL CHECK (tong_phai_thu >= 0),
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'TAM_TINH' COMMENT 'TAM_TINH, DA_CHOT',
    thoi_gian_in_tam_tinh TIMESTAMP NULL,
    thoi_gian_chot TIMESTAMP NULL,
    CONSTRAINT fk_hoadon_donhang FOREIGN KEY (don_hang_id) REFERENCES don_hang(id),
    CONSTRAINT fk_hoadon_ca FOREIGN KEY (ca_lam_viec_id) REFERENCES ca_lam_viec(id),
    CONSTRAINT fk_hoadon_thungan FOREIGN KEY (thu_ngan_id) REFERENCES tai_khoan(id),
    CONSTRAINT fk_hoadon_qlduyetgiamgia FOREIGN KEY (quan_ly_duyet_giam_gia_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng 23: Giao dịch thanh toán của Hóa đơn (Tiền mặt, Chuyển khoản, Thẻ, Ví)
CREATE TABLE IF NOT EXISTS giao_dich_thanh_toan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hoa_don_id BIGINT NOT NULL,
    phuong_thuc VARCHAR(30) NOT NULL COMMENT 'TIEN_MAT, CHUYEN_KHOAN, THE, VI_DIEN_TU',
    so_tien DECIMAL(15,2) NOT NULL CHECK (so_tien > 0),
    ma_tham_chieu_ngan_hang VARCHAR(100),
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gdthanhtoan_hoadon FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng 25: Hộp thư sự kiện đi (Transactional Outbox cho RabbitMQ & Kafka - BR-12, BR-16)
CREATE TABLE IF NOT EXISTS hop_thu_su_kien_di (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_su_kien VARCHAR(64) NOT NULL UNIQUE COMMENT 'UUID dùng để chống trùng phía Consumer',
    kenh_dich VARCHAR(20) NOT NULL COMMENT 'RABBITMQ, KAFKA',
    routing_key_hoac_topic VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_GUI' COMMENT 'CHO_GUI, DA_GUI, LOI_DEAD_LETTER',
    so_lan_thu_lai INT NOT NULL DEFAULT 0,
    loi_chi_tiet TEXT,
    thoi_gian_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_gui TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 26: Chống xử lý trùng sự kiện đến (Idempotent Consumer - BR-16)
CREATE TABLE IF NOT EXISTS su_kien_da_xu_ly (
    ma_su_kien VARCHAR(64) PRIMARY KEY COMMENT 'Mã sự kiện từ RabbitMQ/Kafka đã xử lý thành công',
    ten_consumer VARCHAR(100) NOT NULL,
    thoi_gian_xu_ly TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

