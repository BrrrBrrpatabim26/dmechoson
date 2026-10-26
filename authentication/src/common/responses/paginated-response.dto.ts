import { ApiProperty } from '@nestjs/swagger';

/**
 * Cấu trúc phân trang chuẩn hóa cho mọi phản hồi danh sách trong hệ thống.
 */
export class PaginatedResult<T> {
  @ApiProperty({ description: 'Danh sách các phần tử dữ liệu trong trang hiện tại', isArray: true })
  items: T[];

  @ApiProperty({ description: 'Tổng số bản ghi thỏa mãn điều kiện lọc', example: 42 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại (bắt đầu từ 1)', example: 1 })
  page: number;

  @ApiProperty({ description: 'Số phần tử trên mỗi trang', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang', example: 5 })
  totalPages: number;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / (limit || 10));
  }
}
