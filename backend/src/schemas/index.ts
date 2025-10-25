import { FastifySchema } from 'fastify';

// Parameter schemas
export const romanParamSchema = {
  type: 'object',
  properties: {
    inputValue: {
      type: 'number',
      minimum: 1,
      maximum: 3999,
      description: 'Arabic number to convert to Roman numeral'
    }
  },
  required: ['inputValue'],
  additionalProperties: false
} as const;

export const arabicParamSchema = {
  type: 'object',
  properties: {
    inputValue: {
      type: 'string',
      pattern: '^[IVXLCDM]+$',
      minLength: 1,
      maxLength: 15,
      description: 'Roman numeral to convert to Arabic number'
    }
  },
  required: ['inputValue'],
  additionalProperties: false
} as const;

// Querystring schemas
export const allQuerystringSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'number',
      minimum: 1,
      maximum: 1000,
      default: 100,
      description: 'Maximum number of results to return'
    },
    offset: {
      type: 'number',
      minimum: 0,
      default: 0,
      description: 'Number of results to skip'
    }
  },
  additionalProperties: false
} as const;

// Response schemas
export const conversionResponseSchema = {
  type: 'object',
  properties: {
    inputValue: {
      oneOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    },
    convertedValue: {
      oneOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    }
  },
  required: ['inputValue', 'convertedValue'],
  additionalProperties: false
} as const;

export const errorResponseSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'string'
    }
  },
  required: ['error'],
  additionalProperties: false
} as const;

export const deleteResponseSchema = {
  type: 'object',
  properties: {
    deleted: {
      type: 'number',
      minimum: 0
    }
  },
  required: ['deleted'],
  additionalProperties: false
} as const;

export const healthResponseSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['healthy', 'unhealthy']
    },
    database: {
      type: 'string'
    },
    timestamp: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['status', 'database', 'timestamp'],
  additionalProperties: false
} as const;

// Complete route schemas
export const romanRouteSchema: FastifySchema = {
  params: romanParamSchema,
  response: {
    200: conversionResponseSchema,
    400: errorResponseSchema
  }
} as const;

export const arabicRouteSchema: FastifySchema = {
  params: arabicParamSchema,
  response: {
    200: conversionResponseSchema,
    400: errorResponseSchema
  }
} as const;

export const allRouteSchema: FastifySchema = {
  querystring: allQuerystringSchema,
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              arabic: { type: 'number' },
              roman: { type: 'string' }
            },
            required: ['arabic', 'roman'],
            additionalProperties: false
          }
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' }
      },
      required: ['data', 'total', 'limit', 'offset'],
      additionalProperties: false
    },
    400: errorResponseSchema,
    500: errorResponseSchema
  }
} as const;

export const deleteRouteSchema: FastifySchema = {
  response: {
    200: deleteResponseSchema,
    500: errorResponseSchema
  }
} as const;

export const healthRouteSchema: FastifySchema = {
  response: {
    200: healthResponseSchema
  }
} as const;
