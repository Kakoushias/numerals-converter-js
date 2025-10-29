import { Pool } from 'pg';
import { IConverterRepository } from './IConverterRepository';
import { Conversion, PaginatedResult } from '../types';

export class PostgresRepository implements IConverterRepository {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (error) => {
      console.error('PostgreSQL pool error:', error);
    });
  }

  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversions (
          id SERIAL PRIMARY KEY,
          arabic INTEGER UNIQUE NOT NULL,
          roman VARCHAR(20) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversions_arabic ON conversions(arabic);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversions_roman ON conversions(roman);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);
      `);
    } finally {
      client.release();
    }
  }

  async save(arabic: number, roman: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Use ON CONFLICT to handle race conditions atomically
      // Since we have unique constraints on both arabic and roman, we need to catch
      // conflicts on either column. PostgreSQL doesn't support multiple ON CONFLICT
      // clauses, so we catch the error and ignore it if it's a duplicate key violation.
      try {
        await client.query(
          'INSERT INTO conversions (arabic, roman) VALUES ($1, $2) ON CONFLICT (arabic) DO NOTHING',
          [arabic, roman]
        );
      } catch (error: any) {
        // If the error is a duplicate key violation on roman column, ignore it (first-write-wins)
        if (error.code !== '23505') {
          throw error;
        }
      }
    } finally {
      client.release();
    }
  }

  async findByArabic(arabic: number): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT roman FROM conversions WHERE arabic = $1',
        [arabic]
      );
      return result.rows[0]?.roman || null;
    } finally {
      client.release();
    }
  }

  async findByRoman(roman: string): Promise<number | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT arabic FROM conversions WHERE roman = $1',
        [roman]
      );
      return result.rows[0]?.arabic || null;
    } finally {
      client.release();
    }
  }

  async getAll(limit: number, offset: number): Promise<PaginatedResult<Conversion>> {
    const client = await this.pool.connect();
    try {
      // Get total count
      const countResult = await client.query('SELECT COUNT(*) FROM conversions');
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const result = await client.query(
        'SELECT arabic, roman FROM conversions ORDER BY arabic LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      const conversions: Conversion[] = result.rows.map(row => ({
        arabic: row.arabic,
        roman: row.roman
      }));

      return {
        data: conversions,
        total,
        limit,
        offset
      };
    } finally {
      client.release();
    }
  }

  async deleteAll(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM conversions');
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async isHealthy(): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } catch {
      return false;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
