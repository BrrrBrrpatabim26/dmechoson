import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // E2E dùng chung 1 PostgreSQL -> bắt buộc chạy NỐI TIẾP theo file để
    // tránh race khi TRUNCATE bảng giữa các suite.
    fileParallelism: false,
    // Boot Nest app + TypeORM synchronize + verify Argon2 có thể chậm.
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
