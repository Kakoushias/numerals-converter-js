import Redis from 'ioredis';
import { IConverterRepository } from './IConverterRepository';
import { Conversion, PaginatedResult } from '../types';

export class RedisRepository implements IConverterRepository {
  private redis: Redis;
  private readonly arabicKeyPrefix = 'arabic:';
  private readonly romanKeyPrefix = 'roman:';
  private readonly allConversionsKey = 'conversions:all';

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async save(arabic: number, roman: string): Promise<void> {
    // Lua script for atomic check-and-set operation
    // First-write-wins: only sets values if both keys don't exist
    const luaScript = `
      local arabicKey = KEYS[1]
      local romanKey = KEYS[2]
      local sortedSetKey = KEYS[3]
      local arabicValue = ARGV[1]
      local romanValue = ARGV[2]
      local entry = ARGV[3]
      
      -- Check if either key already exists (bidirectional conflict check)
      local existingArabic = redis.call('GET', arabicKey)
      local existingRoman = redis.call('GET', romanKey)
      
      if existingArabic == false and existingRoman == false then
        -- Atomic insert: all operations succeed or none
        redis.call('SET', arabicKey, romanValue)
        redis.call('SET', romanKey, arabicValue)
        redis.call('ZADD', sortedSetKey, arabicValue, entry)
        return 1  -- Success
      else
        -- Conflict detected - key already exists (first-write-wins)
        return 0  -- No operation performed
      end
    `;
    
    const arabicKey = `${this.arabicKeyPrefix}${arabic}`;
    const romanKey = `${this.romanKeyPrefix}${roman}`;
    const entry = `${arabic}:${roman}`;
    
    await this.redis.eval(
      luaScript,
      3, // number of keys
      arabicKey,
      romanKey,
      this.allConversionsKey,
      arabic.toString(),
      roman,
      entry
    );
    
    // Result is 1 if inserted, 0 if conflict (silently ignored for first-write-wins)
    // We don't throw an error on conflict as per first-write-wins strategy
  }

  async findByArabic(arabic: number): Promise<string | null> {
    return await this.redis.get(`${this.arabicKeyPrefix}${arabic}`);
  }

  async findByRoman(roman: string): Promise<number | null> {
    const result = await this.redis.get(`${this.romanKeyPrefix}${roman}`);
    return result ? parseInt(result, 10) : null;
  }

  async getAll(limit: number, offset: number): Promise<PaginatedResult<Conversion>> {
    // Get total count
    const total = await this.redis.zcard(this.allConversionsKey);
    
    // Get paginated results (sorted by arabic number)
    const results = await this.redis.zrange(
      this.allConversionsKey,
      offset,
      offset + limit - 1
    );

    const conversions: Conversion[] = results.map(item => {
      const [arabic, roman] = item.split(':');
      return {
        arabic: parseInt(arabic, 10),
        roman
      };
    });

    return {
      data: conversions,
      total,
      limit,
      offset
    };
  }

  async deleteAll(): Promise<number> {
    // Get all keys to delete
    const arabicKeys = await this.redis.keys(`${this.arabicKeyPrefix}*`);
    const romanKeys = await this.redis.keys(`${this.romanKeyPrefix}*`);
    const allKeys = [...arabicKeys, ...romanKeys, this.allConversionsKey];

    if (allKeys.length === 0) {
      return 0;
    }

    // Delete all keys
    await this.redis.del(...allKeys);
    return allKeys.length - 1; // Subtract 1 for the allConversionsKey
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }
}
