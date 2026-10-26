import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum AuditLogStatusFilter {
  ALL = 'ALL',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * DTO chứa tham số truy vấn (Query Parameters) cho danh sách lịch sử đăng nhập (Audit Logs).
 */
export class QueryAuditLogsDto {
  @ApiPropertyOptional({
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số bản ghi trên mỗi trang (tối đa 100)',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái kết quả đăng nhập',
    enum: AuditLogStatusFilter,
    default: AuditLogStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(AuditLogStatusFilter)
  status?: AuditLogStatusFilter = AuditLogStatusFilter.ALL;

  @ApiPropertyOptional({
    description: 'Tên trường dùng để sắp xếp',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Chiều sắp xếp (ASC: Tăng dần, DESC: Giảm dần)',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
