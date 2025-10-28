# Performance Testing

This directory contains performance testing tools for the Roman Numerals Converter application.

## Structure

```
performance/
├── benchmarks/          # Internal TypeScript benchmarks
│   └── benchmark.ts     # Redis vs PostgreSQL performance comparison
├── k6/                  # K6 API load testing
│   ├── config.js        # Shared configuration
│   ├── smoke.test.js    # Smoke tests
│   ├── load.test.js     # Load tests
│   └── stress.test.js   # Stress tests
├── Dockerfile           # Docker image for benchmarks
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Running Benchmarks

### Internal Benchmarks (TypeScript)

The internal benchmarks compare Redis vs PostgreSQL performance at the repository level.

**Important**: Benchmarks must be run via Docker as they require access to Redis and PostgreSQL services.

```bash
# From project root
npm run benchmark
```

This will:
1. Start Redis and PostgreSQL containers
2. Build and run the benchmark container
3. Execute performance tests
4. Display results
5. Clean up containers

**Note about imports**: The benchmark file uses relative imports like:
```typescript
import { RedisRepository } from '../../backend/src/repositories/RedisRepository';
```

These imports may show warnings in your IDE, but they work correctly when running in Docker because the Dockerfile structures the files as:
```
/app/
  backend/src/
  performance/benchmarks/
```

This is intentional and required for the Docker execution.

## Running K6 Tests

K6 tests perform HTTP-level API load testing.

### Quick Start

```bash
# Smoke tests (basic verification)
npm run perf:smoke

# Load tests (sustained load)
npm run perf:load

# Stress tests (breaking points)
npm run perf:stress

# Run all tests
npm run perf:all
```

### Test Types

**Smoke Tests**:
- 1 VU for ~30 seconds
- Verifies endpoints return 200
- Validates response structure
- Threshold: 95% success, p95 < 500ms

**Load Tests**:
- Ramp up: 0 → 50 → 100 VUs over 5 minutes
- Sustained: 100 VUs for 10 minutes
- Ramp down: 100 → 0 VUs over 2 minutes
- Threshold: 99% success, p95 < 300ms

**Stress Tests**:
- Aggressive ramp-up to 500 VUs
- Finds system breaking points
- Monitors degradation patterns
- Threshold: Track error rate increase

### Manual K6 Execution

For more control:

```bash
# Start dev environment
docker compose --profile dev up -d --wait

# Run specific test
docker compose run --rm k6 run /scripts/smoke.test.js

# Run with custom options
docker compose run --rm k6 run --vus 10 --duration 30s /scripts/smoke.test.js

# Stop services
docker compose down
```

## Development

### Local Development

The benchmark script can be run locally if you have Redis and PostgreSQL running:

```bash
cd performance
npm run benchmark
```

However, you'll need to update the connection strings in `benchmark.ts` to use `localhost` instead of Docker hostnames.

### Adding New Tests

**For K6 tests**:
1. Create a new `.test.js` file in `k6/`
2. Import shared config from `config.js`
3. Define test scenarios and thresholds
4. Add npm script in root `package.json`

**For benchmarks**:
1. Edit `benchmarks/benchmark.ts`
2. Add new test scenarios
3. Rebuild Docker image: `docker compose build benchmark`

## Troubleshooting

### Benchmark fails to connect to databases

Make sure Docker services are healthy:
```bash
docker compose ps
```

All services should show "healthy" status.

### K6 tests fail with connection errors

Ensure backend is running and healthy:
```bash
docker compose --profile dev up -d --wait
docker compose ps backend-dev
```

### Import errors in IDE

The relative imports in `benchmark.ts` are designed for Docker execution. They may show warnings in your IDE but will work correctly when run via `npm run benchmark`.

If you want to run benchmarks locally for development:
1. Start local Redis: `docker run -d -p 6379:6379 redis:alpine`
2. Start local PostgreSQL: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:alpine`
3. Update connection strings in `benchmark.ts` to use `localhost`

## Performance Baselines

### Expected Benchmark Results

Based on 1000 iterations:
- Redis write operations: ~2,500-3,000 ops/sec
- PostgreSQL write operations: ~1,000-1,500 ops/sec
- Redis read operations: ~3,500-4,500 ops/sec
- PostgreSQL read operations: ~2,000-2,500 ops/sec

### Expected K6 Results

- **Smoke tests**: All checks pass, p95 < 500ms
- **Load tests**: 99%+ success rate, p95 < 300ms at 100 VUs
- **Stress tests**: System should handle 200+ VUs before degradation

## CI/CD Integration

To run in CI/CD pipelines:

```bash
# Run benchmarks
npm run benchmark

# Run smoke tests only (fast)
npm run perf:smoke

# Run all performance tests (slow)
npm run perf:all
```

