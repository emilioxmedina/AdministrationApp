import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { Employee } from '../entities/employee.entity.js';
import { InventoryItem } from '../entities/inventory-item.entity.js';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'mysql',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 3306),
    username: config.get<string>('DB_USER', 'app_user'),
    password: config.get<string>('DB_PASSWORD', 'app_password'),
    database: config.get<string>('DB_NAME', 'admin_app'),
    entities: [User, Employee, InventoryItem],
    migrations: ['dist/database/migrations/*.js'],
    synchronize: false,
    migrationsRun: true,
  }),
};
