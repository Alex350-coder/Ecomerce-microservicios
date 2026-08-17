import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchProducts,
  fetchProduct,
  fetchCategories,
  formatPrice,
  PRODUCT_SORTS,
  type Product,
} from './products';
import { ApiError, API_BASE_URL } from './client';

const base = API_BASE_URL;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  return (await promise.catch((e: unknown) => e)) as ApiError;
}

describe('products api', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fetchProducts', () => {
    it('serializes supported query params', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: [], meta: {} }));

      await fetchProducts({
        search: 'iphone',
        categoryId: 'cat-1',
        sort: 'price-desc',
        page: 2,
        limit: 12,
      });

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        `${base}/products?search=iphone&categoryId=cat-1&sort=price-desc&page=2&limit=12`,
      );
    });

    it('serializes the isFeatured boolean as a string', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: [], meta: {} }));

      await fetchProducts({ isFeatured: true, limit: 6 });

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${base}/products?isFeatured=true&limit=6`);
    });

    it('omits empty params and does not append a trailing question mark', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: [], meta: {} }));

      await fetchProducts({});

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${base}/products`);
    });

    it('returns the paginated envelope', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: [{ id: 'p1', name: 'iPhone' }],
          meta: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      );

      const result = await fetchProducts({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('fetchProduct', () => {
    it('fetches a single product by id', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 'p1', name: 'iPhone', price: 999 }));

      const product: Product = await fetchProduct('p1');

      expect(fetchMock).toHaveBeenCalledWith(`${base}/products/p1`, expect.anything());
      expect(product.id).toBe('p1');
      expect(product.price).toBe(999);
    });

    it('throws ApiError 404 when the product does not exist', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ statusCode: 404, message: 'Producto no encontrado' }, 404),
      );

      const error = await captureError(fetchProduct('missing'));

      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('fetchCategories', () => {
    it('returns the category list', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([{ id: 'c1', name: 'Audio', slug: 'audio', isActive: true }]),
      );

      const categories = await fetchCategories();

      expect(categories).toHaveLength(1);
      expect(categories[0].slug).toBe('audio');
    });
  });

  describe('formatPrice', () => {
    it('formats whole numbers without decimals', () => {
      expect(formatPrice(849)).toBe('$849');
    });

    it('formats fractional prices with two decimals', () => {
      expect(formatPrice(999.91)).toBe('$999.91');
    });
  });

  it('exposes the available sort options', () => {
    expect(PRODUCT_SORTS.map((option) => option.value)).toEqual(
      expect.arrayContaining(['name', 'price-asc', 'price-desc', 'rating', 'newest']),
    );
  });
});
