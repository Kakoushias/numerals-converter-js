# Roman Numerals Converter

A production-grade Roman numerals converter with Node.js backend and React frontend, featuring dual database support (Redis/PostgreSQL), comprehensive testing, and full Docker containerization.

## 🚀 Features

### Backend
- **Fastify API** with high performance and low overhead
- **Dual Database Support**: Redis and PostgreSQL with repository pattern
- **Race Condition Handling**: Atomic operations for concurrent access
- **Rate Limiting**: Configurable request throttling
- **Comprehensive Testing**: Unit, integration, and race condition tests
- **Performance Benchmarks**: Redis vs PostgreSQL comparison
- **Health Checks**: Docker-ready health monitoring
- **Graceful Shutdown**: Proper signal handling
- **Structured Logging**: Pino logger with pretty printing in development

### Frontend
- **React + TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **HeadlessUI**: Accessible components
- **Input Validation**: Real-time validation with helpful error messages
- **Loading States**: User feedback during API calls
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: ARIA labels, keyboard navigation, focus management

### DevOps
- **Multi-stage Docker Builds**: Optimized production images
- **Docker Compose**: Full stack orchestration
- **Health Checks**: Container health monitoring
- **Security**: Non-root users, security headers
- **Performance**: Nginx with gzip compression

## 📋 API Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/roman/:inputValue` | Convert Arabic to Roman | `{ inputValue: number, convertedValue: string }` |
| `GET` | `/arabic/:inputValue` | Convert Roman to Arabic | `{ inputValue: string, convertedValue: number }` |
| `GET` | `/all?limit=100&offset=0` | Get all conversions (paginated) | `{ data: Conversion[], total: number, limit: number, offset: number }` |
| `DELETE` | `/remove` | Clear all conversions | `{ deleted: number }` |
| `GET` | `/health` | Health check | `{ status: string, database: string, timestamp: string }` |

## 👨‍💻 For Reviewers

```bash
# Clone the repository
git clone https://github.com/Kakoushias/numerals-converter-js.git
cd numerals-converter-js

# Run all tests (backend + frontend)
npm run docker:test

# Run the application locally
npm run docker:dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# Health: http://localhost:3001/health

# Stop containers
npm run docker:down

# Clean everything (including volumes)
npm run docker:clean
```

## 🧪 Testing

Run all tests in Docker (no local setup required):

```bash
npm run docker:test
```

Docker handles installing dependencies, setting up databases, running tests, and cleanup. For watch mode, use `npm run docker:test:watch`.

## 📊 Performance Testing

Performance testing includes internal benchmarks and k6 API load testing. All tests run in Docker.

```bash
# Compare Redis vs PostgreSQL performance
npm run benchmark

# API load testing with k6
npm run perf:smoke    # Smoke tests (basic verification)
npm run perf:load     # Load tests (sustained load)
npm run perf:stress   # Stress tests (breaking points)
npm run perf:all      # Run all performance tests
```

## 🏗️ Architecture

### Repository Pattern
The application uses the Repository pattern with dependency injection:

```typescript
interface IConverterRepository {
  save(arabic: number, roman: string): Promise<void>;
  findByArabic(arabic: number): Promise<string | null>;
  findByRoman(roman: string): Promise<number | null>;
  getAll(limit: number, offset: number): Promise<PaginatedResult<Conversion>>;
  deleteAll(): Promise<number>;
  isHealthy(): Promise<boolean>;
}
```

### Database Implementations
- **RedisRepository**: Uses Redis with sorted sets for pagination
- **PostgresRepository**: Uses PostgreSQL with proper indexing and constraints

### Race Condition Handling
- **Redis**: Uses Lua scripting for atomic operations with bidirectional conflict checking
- **PostgreSQL**: Uses explicit transactions with existence checks to handle unique constraints on both arabic and roman columns
- **Service Layer**: Fire-and-forget caching strategy for performance, relying on repository atomicity
- **Test Isolation**: Separate databases for testing (Redis database 1, PostgreSQL numerals_test)

## 🔧 Configuration

### Environment Variables

#### Backend
```bash
# Server
PORT=3001
NODE_ENV=production

# Database
DB_TYPE=redis                    # Options: redis, postgres
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://postgres:password@localhost:5432/numerals

# Rate Limiting
# Production default: 5000 req/min (~83 req/sec) - aligns with tested capacity of 132 req/sec
# Development default: 50000 req/min for load testing with k6
# Adjust based on your needs - system tested at 132 req/sec sustained with 100 concurrent users
RATE_LIMIT_MAX=5000
RATE_LIMIT_TIME_WINDOW=60000

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

#### Frontend
```bash
VITE_API_URL=http://localhost:3001
```

## 🚀 Production Features

The application uses Docker multi-stage builds for optimized production images. It includes health checks, graceful shutdown handling, and security features such as non-root container users, security headers, and CORS configuration. The backend supports both Redis and PostgreSQL databases with the repository pattern, allowing flexible deployment options.

## 📈 Monitoring

Health checks are available at `/health` endpoints for both backend and frontend. Backend logging uses structured JSON with Pino, while development mode provides pretty-printed logs for readability.

## 🧪 Testing Strategy

- **Backend**: Unit tests for conversion logic and repository methods, integration tests for API endpoints, race condition tests for concurrent operations, and performance benchmarks
- **Frontend**: Component tests with React Testing Library, integration tests for user interactions, and accessibility tests

## 💡 Implementation Notes

This section documents intentional design decisions, trade-offs, and known limitations.

### Fire-and-Forget Caching Strategy

The `ConversionService` uses a fire-and-forget approach for caching, providing immediate responses without waiting for database writes. This is acceptable since cache misses only result in cheap recomputation, and we rely on repository-level atomicity (Lua scripts for Redis, transactions for PostgreSQL) to handle race conditions.

Consider message queues (RabbitMQ, Redis Streams, AWS SQS) when: you need guaranteed delivery and retry logic, high write volume requires buffering, caching triggers complex workflows (analytics, notifications), you need guaranteed audit trails, or multiple services must react to conversion events.

### API Design Preferences

**Current:** `/roman/:inputValue`, `/arabic/:inputValue`, `/all?limit=100&offset=0`, `DELETE /remove`

**Preferred:** A single `/convert?fromType=arabic&toType=roman&input=42` endpoint with `/history` for paginated results. This reduces API surface area, follows REST conventions (resources are nouns), and makes adding new conversion types easier. The current design was kept simple and explicit for clarity in the interview context.

### ORM Decision

Direct SQL queries are used instead of an ORM because this is a single-table cache with two columns. Raw queries provide better performance, direct access to database-specific features (Lua scripts for Redis, PostgreSQL's ON CONFLICT), and explicit SQL that's easier to optimize and debug.

Consider an ORM (TypeORM, Prisma, Sequelize) when: you have complex relations with multiple tables and joins, need automated schema migrations, want compile-time type checking for queries, need standardized patterns for a large team, or are doing rapid prototyping. An ORM would be justified if this project had user accounts, multiple conversion types, audit logs with relationships, or complex reporting.

### Algorithm Simplicity

A simple greedy algorithm with hardcoded value-to-numeral mappings is optimal for Roman numerals: there are only 13 fixed mappings, it provides O(1) space and effectively constant time for the 1-3999 range, and the code is immediately readable and verifiable without abstraction overhead.

If the project needed to support multiple numeral systems, architectural options include: Strategy Pattern with Registry, Plugin Architecture, Rule-Based Engine, or Configuration-Driven approaches. Only add abstraction when you have 3+ conversion types - until then, YAGNI (You Aren't Gonna Need It).
