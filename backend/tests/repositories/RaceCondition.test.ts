import { RedisRepository } from '../../src/repositories/RedisRepository';
import { PostgresRepository } from '../../src/repositories/PostgresRepository';

describe('Race Condition Tests', () => {
  const testCases = [
    { arabic: 2023, roman: 'MMXXIII' },
    { arabic: 123, roman: 'CXXIII' },
    { arabic: 999, roman: 'CMXCIX' }
  ];

  describe('Redis Repository Race Conditions', () => {
    let redisRepo: RedisRepository;

    beforeAll(async () => {
      redisRepo = new RedisRepository('redis://localhost:6379');
    });

    afterAll(async () => {
      await redisRepo.disconnect();
    });

    beforeEach(async () => {
      await redisRepo.deleteAll();
    });

    it('should handle concurrent saves of the same conversion', async () => {
      const { arabic, roman } = testCases[0];
      
      // Simulate concurrent saves
      const promises = Array(10).fill(null).map(() => 
        redisRepo.save(arabic, roman)
      );

      await Promise.all(promises);

      // Verify the conversion was saved correctly
      const result = await redisRepo.findByArabic(arabic);
      expect(result).toBe(roman);
    });

    it('should handle concurrent saves of different conversions', async () => {
      const promises = testCases.map(({ arabic, roman }) =>
        redisRepo.save(arabic, roman)
      );

      await Promise.all(promises);

      // Verify all conversions were saved
      for (const { arabic, roman } of testCases) {
        const result = await redisRepo.findByArabic(arabic);
        expect(result).toBe(roman);
      }
    });

    it('should handle concurrent reads and writes', async () => {
      const { arabic, roman } = testCases[0];
      
      // Start a write operation
      const writePromise = redisRepo.save(arabic, roman);
      
      // Start multiple read operations concurrently
      const readPromises = Array(5).fill(null).map(() =>
        redisRepo.findByArabic(arabic)
      );

      await Promise.all([writePromise, ...readPromises]);

      // Verify the final state
      const result = await redisRepo.findByArabic(arabic);
      expect(result).toBe(roman);
    });
  });

  describe('PostgreSQL Repository Race Conditions', () => {
    let postgresRepo: PostgresRepository;

    beforeAll(async () => {
      postgresRepo = new PostgresRepository(
        process.env.POSTGRES_URL || 'postgresql://postgres:password@localhost:5432/numerals_test'
      );
      await postgresRepo.initialize();
    });

    afterAll(async () => {
      await postgresRepo.close();
    });

    beforeEach(async () => {
      await postgresRepo.deleteAll();
    });

    it('should handle concurrent saves of the same conversion', async () => {
      const { arabic, roman } = testCases[0];
      
      // Simulate concurrent saves
      const promises = Array(10).fill(null).map(() => 
        postgresRepo.save(arabic, roman)
      );

      await Promise.all(promises);

      // Verify the conversion was saved correctly
      const result = await postgresRepo.findByArabic(arabic);
      expect(result).toBe(roman);
    });

    it('should handle concurrent saves of different conversions', async () => {
      const promises = testCases.map(({ arabic, roman }) =>
        postgresRepo.save(arabic, roman)
      );

      await Promise.all(promises);

      // Verify all conversions were saved
      for (const { arabic, roman } of testCases) {
        const result = await postgresRepo.findByArabic(arabic);
        expect(result).toBe(roman);
      }
    });

    it('should handle concurrent reads and writes', async () => {
      const { arabic, roman } = testCases[0];
      
      // Start a write operation
      const writePromise = postgresRepo.save(arabic, roman);
      
      // Start multiple read operations concurrently
      const readPromises = Array(5).fill(null).map(() =>
        postgresRepo.findByArabic(arabic)
      );

      await Promise.all([writePromise, ...readPromises]);

      // Verify the final state
      const result = await postgresRepo.findByArabic(arabic);
      expect(result).toBe(roman);
    });
  });
});
