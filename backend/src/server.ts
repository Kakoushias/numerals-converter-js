import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ConversionService } from './services/ConversionService';
import { RepositoryFactory, DatabaseType } from './repositories/RepositoryFactory';
import { IConverterRepository } from './repositories/IConverterRepository';
import { ConversionResponse, DeleteResponse } from './types';
import { 
  romanRouteSchema, 
  arabicRouteSchema, 
  allRouteSchema, 
  deleteRouteSchema, 
  healthRouteSchema 
} from './schemas';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development' ? {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  } : {
    level: process.env.LOG_LEVEL || 'info'
  }
});

// Global variables
let repository: IConverterRepository;
let conversionService: ConversionService;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await fastify.close();
    
    // Close database connections
    if ('disconnect' in repository) {
      await (repository as any).disconnect();
    } else if ('close' in repository) {
      await (repository as any).close();
    }
    
    process.exit(0);
  } catch (error) {
    fastify.log.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Register plugins
async function registerPlugins() {
  // CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
  
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests
      // TODO: review this
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For development, allow localhost with any port
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      // Reject origin
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000')
  });
}

// Initialize database and services
async function initializeServices() {
  const dbType = (process.env.DB_TYPE || 'redis') as DatabaseType;
  const connectionString = RepositoryFactory.getConnectionString(dbType);
  
  fastify.log.info(`Initializing ${dbType} repository...`);
  repository = await RepositoryFactory.createRepository(dbType, connectionString);
  conversionService = new ConversionService(repository);
  
  fastify.log.info('Services initialized successfully');
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', { schema: healthRouteSchema }, async () => {
    const isHealthy = await repository.isHealthy();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: process.env.DB_TYPE || 'redis',
      timestamp: new Date().toISOString()
    };
  });

  // Convert Arabic to Roman
  fastify.get<{
    Params: { inputValue: number }
  }>('/roman/:inputValue', { schema: romanRouteSchema }, async (request, reply) => {
    const { inputValue } = request.params;

    try {
      const roman = await conversionService.arabicToRoman(inputValue);
      const response: ConversionResponse = {
        inputValue,
        convertedValue: roman
      };
      return response;
    } catch (error) {
      fastify.log.error({ error }, 'Error converting Arabic to Roman');
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Conversion failed'
      });
    }
  });

  // Convert Roman to Arabic
  fastify.get<{
    Params: { inputValue: string }
  }>('/arabic/:inputValue', { schema: arabicRouteSchema }, async (request, reply) => {
    const { inputValue } = request.params;
    
    // Convert to uppercase for processing (schema validates pattern)
    const romanUpper = inputValue.toUpperCase();
    
    try {
      const arabic = await conversionService.romanToArabic(romanUpper);
      const response: ConversionResponse = {
        inputValue,
        convertedValue: arabic
      };
      return response;
    } catch (error) {
      fastify.log.error({ error }, 'Error converting Roman to Arabic');
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Invalid Roman numeral'
      });
    }
  });

  // Get all conversions (paginated)
  fastify.get<{
    Querystring: { limit?: number; offset?: number }
  }>('/all', { schema: allRouteSchema }, async (request, reply) => {
    const limit = Math.min(request.query.limit || 100, 1000);
    const offset = request.query.offset || 0;

    try {
      const result = await repository.getAll(limit, offset);
      return result;
    } catch (error) {
      fastify.log.error({ error }, 'Error retrieving conversions');
      return reply.status(500).send({
        error: 'Failed to retrieve conversions'
      });
    }
  });

  // Delete all conversions
  fastify.delete('/remove', { schema: deleteRouteSchema }, async (_request, reply) => {
    try {
      const deleted = await repository.deleteAll();
      const response: DeleteResponse = { deleted };
      return response;
    } catch (error) {
      fastify.log.error({ error }, 'Error deleting conversions');
      return reply.status(500).send({
        error: 'Failed to delete conversions'
      });
    }
  });
}

// Error handler
fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error({ error }, 'Unhandled error');
  
  if (error.statusCode) {
    reply.status(error.statusCode);
  } else {
    reply.status(500);
  }
  
  return {
    error: error.message || 'Internal server error'
  };
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await initializeServices();
    await registerRoutes();
    
    const port = parseInt(process.env.PORT || '3001');
    const host = '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port} (hot reload enabled)`);
  } catch (error) {
    fastify.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
