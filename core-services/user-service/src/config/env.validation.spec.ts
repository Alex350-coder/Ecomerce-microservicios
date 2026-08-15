import { envValidationSchema } from './env.validation';

const validBase = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'user',
  DB_PASSWORD: 'pass',
  DB_DATABASE: 'user_db',
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

  it('defaults the port to 3001', () => {
    const result = envValidationSchema.validate(validBase);
    expect(result.value.PORT).toBe(3001);
  });
});
