import { envValidationSchema } from './env.validation';

const validBase = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'user',
  DB_PASSWORD: 'pass',
  DB_DATABASE: 'product_db',
  JWT_SECRET: 'a-secret-long-enough-16',
};

describe('envValidationSchema', () => {
  it('accepts a valid configuration', () => {
    const result = envValidationSchema.validate(validBase);
    expect(result.error).toBeUndefined();
  });

  it('rejects a configuration without JWT_SECRET', () => {
    const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = validBase;
    const result = envValidationSchema.validate({
      DB_HOST,
      DB_USERNAME,
      DB_PASSWORD,
      DB_DATABASE,
    });
    expect(result.error).toBeDefined();
  });

  it('rejects a too-short JWT_SECRET', () => {
    const result = envValidationSchema.validate({ ...validBase, JWT_SECRET: 'short' });
    expect(result.error).toBeDefined();
  });

  it('defaults DB_MIGRATIONS_RUN to false', () => {
    const result = envValidationSchema.validate(validBase);
    expect(result.value.DB_MIGRATIONS_RUN).toBe(false);
  });

  it('defaults the port to 3003', () => {
    const result = envValidationSchema.validate(validBase);
    expect(result.value.PORT).toBe(3003);
  });
});
