import { IConverterRepository } from './IConverterRepository';
import { RedisRepository } from './RedisRepository';
import { PostgresRepository } from './PostgresRepository';

export type DatabaseType = 'redis' | 'postgres';

export class RepositoryFactory {
  static async createRepository(
    dbType: DatabaseType,
    connectionString: string
  ): Promise<IConverterRepository> {
    switch (dbType) {
      case 'redis':
        const redisRepo = new RedisRepository(connectionString);
        return redisRepo;

      case 'postgres':
        const postgresRepo = new PostgresRepository(connectionString);
        await postgresRepo.initialize();
        return postgresRepo;

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  static getConnectionString(dbType: DatabaseType): string {
    switch (dbType) {
      case 'redis':
        return process.env.REDIS_URL || 'redis://localhost:6379';
      
      case 'postgres':
        return process.env.POSTGRES_URL || 'postgresql://postgres:password@localhost:5432/numerals';
      
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}
