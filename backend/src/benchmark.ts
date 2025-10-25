import { RedisRepository } from './repositories/RedisRepository';
import { PostgresRepository } from './repositories/PostgresRepository';
import { ConversionService } from './services/ConversionService';

interface BenchmarkResult {
  operation: string;
  database: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  operationsPerSecond: number;
}

class Benchmark {
  private results: BenchmarkResult[] = [];

  async runBenchmark(
    name: string,
    database: string,
    iterations: number,
    operation: () => Promise<void>
  ): Promise<BenchmarkResult> {
    console.log(`Running ${name} benchmark (${iterations} iterations)...`);
    
    const startTime = process.hrtime.bigint();
    
    const promises = Array(iterations).fill(null).map(() => operation());
    await Promise.all(promises);
    
    const endTime = process.hrtime.bigint();
    const totalTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    const avgTime = totalTime / iterations;
    const operationsPerSecond = (iterations / totalTime) * 1000;

    const result: BenchmarkResult = {
      operation: name,
      database,
      iterations,
      totalTime,
      avgTime,
      operationsPerSecond
    };

    this.results.push(result);
    return result;
  }

  printResults(): void {
    console.log('\n=== BENCHMARK RESULTS ===\n');
    
    // Group results by operation
    const grouped = this.results.reduce((acc, result) => {
      if (!acc[result.operation]) {
        acc[result.operation] = [];
      }
      acc[result.operation].push(result);
      return acc;
    }, {} as Record<string, BenchmarkResult[]>);

    Object.entries(grouped).forEach(([operation, results]) => {
      console.log(`${operation.toUpperCase()}:`);
      results.forEach(result => {
        console.log(`  ${result.database.padEnd(10)} | ${result.operationsPerSecond.toFixed(2).padStart(8)} ops/sec | ${result.avgTime.toFixed(2).padStart(6)}ms avg`);
      });
      console.log('');
    });

    // Performance comparison
    console.log('PERFORMANCE COMPARISON:');
    Object.entries(grouped).forEach(([operation, results]) => {
      if (results.length === 2) {
        const [redis, postgres] = results;
        const faster = redis.operationsPerSecond > postgres.operationsPerSecond ? 'Redis' : 'PostgreSQL';
        const ratio = Math.max(redis.operationsPerSecond, postgres.operationsPerSecond) / 
                     Math.min(redis.operationsPerSecond, postgres.operationsPerSecond);
        console.log(`  ${operation}: ${faster} is ${ratio.toFixed(2)}x faster`);
      }
    });
  }
}

async function runBenchmarks(): Promise<void> {
  const benchmark = new Benchmark();
  const iterations = 1000;

  // Test data
  const testData = [
    { arabic: 1, roman: 'I' },
    { arabic: 4, roman: 'IV' },
    { arabic: 9, roman: 'IX' },
    { arabic: 40, roman: 'XL' },
    { arabic: 90, roman: 'XC' },
    { arabic: 400, roman: 'CD' },
    { arabic: 900, roman: 'CM' },
    { arabic: 2023, roman: 'MMXXIII' },
    { arabic: 3999, roman: 'MMMCMXCIX' }
  ];

  // Redis benchmarks
  console.log('Setting up Redis...');
  const redisRepo = new RedisRepository(process.env.REDIS_URL || 'redis://redis:6379');
  const redisService = new ConversionService(redisRepo);
  await redisRepo.deleteAll();

  // PostgreSQL benchmarks
  console.log('Setting up PostgreSQL...');
  const postgresRepo = new PostgresRepository(
    process.env.POSTGRES_URL || 'postgresql://postgres:password@postgres:5432/numerals'
  );
  await postgresRepo.initialize();
  const postgresService = new ConversionService(postgresRepo);
  await postgresRepo.deleteAll();

  try {
    // Write benchmarks
    await benchmark.runBenchmark(
      'Write Operations',
      'Redis',
      iterations,
      async () => {
        const data = testData[Math.floor(Math.random() * testData.length)];
        await redisRepo.save(data.arabic, data.roman);
      }
    );

    await benchmark.runBenchmark(
      'Write Operations',
      'PostgreSQL',
      iterations,
      async () => {
        const data = testData[Math.floor(Math.random() * testData.length)];
        await postgresRepo.save(data.arabic, data.roman);
      }
    );

    // Read benchmarks
    await benchmark.runBenchmark(
      'Read Operations',
      'Redis',
      iterations,
      async () => {
        const data = testData[Math.floor(Math.random() * testData.length)];
        await redisRepo.findByArabic(data.arabic);
      }
    );

    await benchmark.runBenchmark(
      'Read Operations',
      'PostgreSQL',
      iterations,
      async () => {
        const data = testData[Math.floor(Math.random() * testData.length)];
        await postgresRepo.findByArabic(data.arabic);
      }
    );

    // Service benchmarks (includes conversion logic)
    await benchmark.runBenchmark(
      'Service Operations',
      'Redis',
      iterations,
      async () => {
        const arabic = Math.floor(Math.random() * 3999) + 1;
        await redisService.arabicToRoman(arabic);
      }
    );

    await benchmark.runBenchmark(
      'Service Operations',
      'PostgreSQL',
      iterations,
      async () => {
        const arabic = Math.floor(Math.random() * 3999) + 1;
        await postgresService.arabicToRoman(arabic);
      }
    );

    // Concurrent operations benchmark
    await benchmark.runBenchmark(
      'Concurrent Operations',
      'Redis',
      iterations,
      async () => {
        const promises = Array(10).fill(null).map(async () => {
          const data = testData[Math.floor(Math.random() * testData.length)];
          await redisRepo.save(data.arabic, data.roman);
          return redisRepo.findByArabic(data.arabic);
        });
        await Promise.all(promises);
      }
    );

    await benchmark.runBenchmark(
      'Concurrent Operations',
      'PostgreSQL',
      iterations,
      async () => {
        const promises = Array(10).fill(null).map(async () => {
          const data = testData[Math.floor(Math.random() * testData.length)];
          await postgresRepo.save(data.arabic, data.roman);
          return postgresRepo.findByArabic(data.arabic);
        });
        await Promise.all(promises);
      }
    );

  } finally {
    // Cleanup
    await redisRepo.disconnect();
    await postgresRepo.close();
  }

  benchmark.printResults();
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}
