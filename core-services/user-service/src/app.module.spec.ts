describe('AppModule', () => {
  const requiredEnv = {
    JWT_SECRET: 'a-secret-long-enough-16',
    DB_HOST: 'localhost',
    DB_USERNAME: 'user',
    DB_PASSWORD: 'pass',
    DB_DATABASE: 'user_db',
  };

  it('should be defined with a valid environment', () => {
    const saved = new Map<string, string | undefined>();
    for (const [key, value] of Object.entries(requiredEnv)) {
      saved.set(key, process.env[key]);
      process.env[key] = value;
    }

    try {
      const { AppModule } = jest.requireActual('./app.module');
      expect(new AppModule()).toBeDefined();
    } finally {
      for (const [key, value] of saved) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });
});
