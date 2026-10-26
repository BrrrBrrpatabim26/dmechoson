import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Đánh dấu endpoint là công khai (Public), bỏ qua kiểm tra JWT xác thực.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
