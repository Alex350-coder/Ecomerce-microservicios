import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(8000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  JWT_SECRET: Joi.string().min(16).when('NODE_ENV', { is: 'production', then: Joi.required() }),
  AUTH_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  USER_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  PRODUCT_SERVICE_URL: Joi.string().uri().default('http://localhost:3003'),
  CART_SERVICE_URL: Joi.string().uri().default('http://localhost:3004'),
  ORDER_SERVICE_URL: Joi.string().uri().default('http://localhost:3005'),
  INVENTORY_SERVICE_URL: Joi.string().uri().default('http://localhost:3006'),
  PAYMENT_SERVICE_URL: Joi.string().uri().default('http://localhost:3007'),
  THROTTLE_GLOBAL_TTL: Joi.number().integer().min(1).default(60000),
  THROTTLE_GLOBAL_LIMIT: Joi.number().integer().min(1).default(100),
  THROTTLE_AUTH_TTL: Joi.number().integer().min(1).default(60000),
  THROTTLE_AUTH_LIMIT: Joi.number().integer().min(1).default(10),
  REQUEST_TIMEOUT_MS: Joi.number().integer().min(1000).default(15000),
  BODY_LIMIT: Joi.string().default('100kb'),
});
