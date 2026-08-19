import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3005),
  CORS_ORIGIN: Joi.string().uri().optional(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),

  JWT_SECRET: Joi.string().min(16).required(),
  INVENTORY_SERVICE_URL: Joi.string().uri().default('http://localhost:3006'),
  PAYMENT_SERVICE_URL: Joi.string().uri().default('http://localhost:3007'),
});
