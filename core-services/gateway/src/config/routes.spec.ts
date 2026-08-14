import { SERVICE_ROUTES } from './routes';

describe('SERVICE_ROUTES', () => {
  it('mapea los 7 servicios core por prefijo', () => {
    const prefixes = SERVICE_ROUTES.map((r) => r.prefix);
    expect(prefixes).toEqual(
      expect.arrayContaining([
        'auth',
        'users',
        'products',
        'cart',
        'orders',
        'inventory',
        'payments',
      ]),
    );
    expect(SERVICE_ROUTES).toHaveLength(7);
  });

  it('todos los prefijos tienen env key definido', () => {
    for (const route of SERVICE_ROUTES) {
      expect(route.envKey).toMatch(/_SERVICE_URL$/);
    }
  });
});
