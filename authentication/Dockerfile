# ==============================================================================
# DOCKERFILE CHO AUTHENTICATION SERVICE (MULTI-STAGE BUILD)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build stage (Biên dịch mã nguồn TypeScript)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Cài đặt các công cụ build C/C++ cần thiết để compile argon2 và bcrypt
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./

# Cài đặt toàn bộ dependencies bao gồm cả devDependencies
RUN npm ci || npm install

# Copy toàn bộ mã nguồn
COPY . .

# Biên dịch mã nguồn NestJS TypeScript sang JavaScript trong thư mục dist/
RUN npm run build

# Xóa devDependencies để chỉ giữ lại production dependencies
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Production runner (Hình ảnh thu nhỏ nhẹ, bảo mật cao)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Thiết lập biến môi trường chạy production
ENV NODE_ENV=production

# Chạy ứng dụng dưới tài khoản không đặc quyền (non-root) để tăng cường bảo mật
USER node

# Copy các thư viện production từ builder
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules

# Copy kết quả biên dịch và file cấu hình từ builder
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/package.json ./package.json
COPY --chown=node:node --from=builder /usr/src/app/config.yaml ./config.yaml

# Cổng lắng nghe là CẤU HÌNH (biến PORT), không hardcode trong Dockerfile.
# EXPOSE chỉ mang tính tài liệu; dùng ARG để không ghim sẵn một số cổng cụ thể.
ARG PORT
ENV PORT=${PORT}

# Khởi chạy ứng dụng NestJS
CMD ["node", "dist/main.js"]
