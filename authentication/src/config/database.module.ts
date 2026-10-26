import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config.js';

@Module({
  imports: [
    // Khởi tạo TypeORM bất đồng bộ để đảm bảo ConfigModule đã load xong .env trước
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Nạp ConfigModule để có ConfigService
      inject: [ConfigService], // Inject ConfigService vào useFactory bên dưới
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),
  ],
  // Export TypeOrmModule để các module khác trong service có thể sử dụng
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
