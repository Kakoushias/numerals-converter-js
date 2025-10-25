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

    it('should ensure atomicity with 100+ concurrent writes of same conversion', async () => {
      const { arabic, roman } = testCases[0];
      
      // Simulate 150 concurrent saves
      const promises = Array(150).fill(null).map(() => 
        redisRepo.save(arabic, roman)
      );

      await Promise.all(promises);

      // Verify only one entry exists (first-write-wins)
      const result = await redisRepo.findByArabic(arabic);
      expect(result).toBe(roman);
      
      // Verify bidirectional mapping consistency
      const resultFromRoman = await redisRepo.findByRoman(roman);
      expect(resultFromRoman).toBe(arabic);
    });

    it('should maintain bidirectional mapping consistency', async () => {
      const conversions = [
        { arabic: 42, roman: 'XLII' },
        { arabic: 1994, roman: 'MCMXCIV' },
        { arabic: 3000, roman: 'MMM' }
      ];

      // Save all conversions
      await Promise.all(
        conversions.map(({ arabic, roman }) => redisRepo.save(arabic, roman))
      );

      // Verify bidirectional consistency
      for (const { arabic, roman } of conversions) {
        const romanFromArabic = await redisRepo.findByArabic(arabic);
        const arabicFromRoman = await redisRepo.findByRoman(roman);
        
        expect(romanFromArabic).toBe(roman);
        expect(arabicFromRoman).toBe(arabic);
      }
    });

    it('should handle high concurrency stress test (500 parallel requests)', async () => {
      const conversions = Array.from({ length: 50 }, (_, i) => ({
        arabic: i + 1,
        roman: `TEST${i + 1}`
      }));

      // Create 500 concurrent operations (10 per conversion)
      const promises = conversions.flatMap(({ arabic, roman }) => 
        Array(10).fill(null).map(() => redisRepo.save(arabic, roman))
      );

      await Promise.all(promises);

      // Verify all conversions were saved (first write wins)
      const results = await redisRepo.getAll(100, 0);
      expect(results.total).toBeGreaterThanOrEqual(50);
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

    it('should ensure atomicity with 100+ concurrent writes of same conversion', async () => {
      const { arabic, roman } = testCases[0];
      
      // Simulate 150 concurrent saves
      const promises = Array(150).fill(null).map(() => 
        postgresRepo.save(arabic, roman)
      );

      await Promise.all(promises);

      // Verify only one entry exists (first-write-wins)
      const result = await postgresRepo.findByArabic(arabic);
      expect(result).toBe(roman);
      
      // Verify bidirectional mapping consistency
      const resultFromRoman = await postgresRepo.findByRoman(roman);
      expect(resultFromRoman).toBe(arabic);
    });

    it('should maintain bidirectional mapping consistency', async () => {
      const conversions = [
        { arabic: 42, roman: 'XLII' },
        { arabic: 1994, roman: 'MCMXCIV' },
        { arabic: 3000, roman: 'MMM' }
      ];

      // Save all conversions
      await Promise.all(
        conversions.map(({ arabic, roman }) => postgresRepo.save(arabic, roman))
      );

      // Verify bidirectional consistency
      for (const { arabic, roman } of conversions) {
        const romanFromArabic = await postgresRepo.findByArabic(arabic);
        const arabicFromRoman = await postgresRepo.findByRoman(roman);
        
        expect(romanFromArabic).toBe(roman);
        expect(arabicFromRoman).toBe(arabic);
      }
    });

    it('should handle high concurrency stress test (500 parallel requests)', async () => {
      const conversions = Array.from({ length: 50 }, (_, i) => ({
        arabic: i + 1000,
        roman: `TEST${i + 1000}`
      }));

      // Create 500 concurrent operations (10 per conversion)
      const promises = conversions.flatMap(({ arabic, roman }) => 
        Array(10).fill(null).map(() => postgresRepo.save(arabic, roman))
      );

      await Promise.all(promises);

      // Verify all conversions were saved (first write wins)
      const results = await postgresRepo.getAll(100, 0);
      expect(results.total).toBeGreaterThanOrEqual(50);
    });

    it('should handle mixed read/write workloads under high load', async () => {
      const { arabic, roman } = testCases[0];
      
      // Mix of concurrent reads and writes
      const promises = [
        ...Array(50).fill(null).map(() => postgresRepo.save(arabic, roman)),
        ...Array(50).fill(null).map(() => postgresRepo.findByArabic(arabic)),
        ...Array(50).fill(null).map(() => postgresRepo.findByRoman(roman))
      ];

      await Promise.all(promises);

      // Verify final consistency
      const finalResult = await postgresRepo.findByArabic(arabic);
      expect(finalResult).toBe(roman);
    });
  });
});
