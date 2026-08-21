import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useCart } from '../context/CartContext';
import {
  fetchProducts,
  fetchCategories,
  formatPrice,
  PRODUCT_SORTS,
  type Product,
  type ProductSort,
} from '../api/products';
import { useDebounce } from '../hooks/useDebounce';
import '../styles/pages/Products.css';

const PAGE_SIZE = 12;

export const Products = () => {
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState<ProductSort>('name');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, sort]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { debouncedSearch, categoryId, sort, page }],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const totalPages = data?.meta.totalPages ?? 0;
  const showPagination = totalPages > 1;

  const handleAddToCart = (product: Product) => {
    addItem({ id: product.id, name: product.name, price: product.price });
  };

  return (
    <MainLayout>
      <div className="products-page">
        <div className="products-header">
          <h1>Nuestros Productos</h1>
          <p>Descubre nuestra amplia gama de tecnología</p>
        </div>

        <div className="products-filters">
          <div className="search-section">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Buscar productos"
            />
          </div>

          <div className="filter-section">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="filter-select"
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las Categorías</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductSort)}
              className="filter-select"
              aria-label="Ordenar productos"
            >
              {PRODUCT_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {data && (
          <div className="products-info">
            <p>
              Mostrando {data.data.length} de {data.meta.total} productos
              {debouncedSearch && ` para "${debouncedSearch}"`}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="products-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon="⚠️"
            title="No se pudieron cargar los productos"
            description="Verifica tu conexión e inténtalo de nuevo."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          />
        )}

        {!isLoading && !isError && data && data.data.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No se encontraron productos"
            description="Intenta con otros filtros o términos de búsqueda."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryId('');
                }}
              >
                Limpiar Filtros
              </Button>
            }
          />
        )}

        {!isLoading && !isError && data && data.data.length > 0 && (
          <>
            <div className="products-grid">
              {data.data.map((product) => (
                <Card key={product.id} hover className="product-card">
                  <div className="product-image">
                    <Link to={`/products/${product.id}`} aria-label={product.name}>
                      <img src={product.images[0] ?? ''} alt={product.name} loading="lazy" />
                    </Link>
                    {product.isNew && <span className="new-badge">Nuevo</span>}
                    {product.originalPrice !== null && product.originalPrice > product.price && (
                      <span className="discount-badge">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="product-content">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="product-name">{product.name}</h3>
                    </Link>
                    <p className="product-description">{product.description}</p>
                    {product.features.length > 0 && (
                      <div className="product-features">
                        {product.features.slice(0, 2).map((feature) => (
                          <span key={feature} className="feature-tag">
                            {feature}
                          </span>
                        ))}
                        {product.features.length > 2 && (
                          <span className="feature-tag">+{product.features.length - 2} más</span>
                        )}
                      </div>
                    )}
                    <div className="product-rating">
                      <span className="stars">{'★'.repeat(Math.floor(product.rating ?? 0))}</span>
                      <span className="rating-text">
                        {product.rating !== null ? `(${product.rating})` : 'Sin valoraciones'} •{' '}
                        {product.reviewCount} reviews
                      </span>
                    </div>
                    <div className="product-footer">
                      <div className="product-prices">
                        <span className="current-price">{formatPrice(product.price)}</span>
                        {product.originalPrice !== null &&
                          product.originalPrice > product.price && (
                            <span className="original-price">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                      </div>
                      <span className="stock-status in-stock">Disponible</span>
                    </div>
                    <Button className="add-to-cart-btn" onClick={() => handleAddToCart(product)}>
                      Agregar al Carrito
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {showPagination && (
              <div className="products-pagination">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </Button>
                <div className="pagination-info">
                  Página {page} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};
