import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useCart } from '../context/CartContext';
import { fetchProduct, formatPrice } from '../api/products';
import '../styles/pages/ProductDetail.css';

export const ProductDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: id.length > 0,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="product-detail-page">
          <Spinner label="Cargando producto..." />
        </div>
      </MainLayout>
    );
  }

  if (isError || !product) {
    return (
      <MainLayout>
        <div className="product-detail-page">
          <div className="no-products">
            <h3>No se pudo cargar el producto</h3>
            <p>Es posible que el producto no exista o que el servicio no esté disponible.</p>
            <Link to="/products">
              <Button variant="outline">Volver al catálogo</Button>
            </Link>
            <Button variant="ghost" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const discountPercent =
    product.originalPrice !== null && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  return (
    <MainLayout>
      <div className="product-detail-page">
        <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/products">Catálogo</Link>
          <span aria-hidden="true">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail__layout">
          <div className="product-detail__gallery">
            {product.images.length > 0 && (
              <img src={product.images[0]} alt={product.name} loading="lazy" />
            )}
          </div>

          <div className="product-detail__info">
            {product.category && (
              <Link
                to={`/products?categoryId=${product.category.id}`}
                className="product-detail__category"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="product-detail__name">{product.name}</h1>

            <div className="product-detail__rating">
              <span className="stars">{'★'.repeat(Math.floor(product.rating ?? 0))}</span>
              <span className="rating-text">
                {product.rating !== null ? `(${product.rating})` : 'Sin valoraciones'} •{' '}
                {product.reviewCount} reviews
              </span>
            </div>

            <div className="product-detail__prices">
              <span className="current-price">{formatPrice(product.price)}</span>
              {discountPercent !== null && product.originalPrice !== null && (
                <>
                  <span className="original-price">{formatPrice(product.originalPrice)}</span>
                  <span className="discount">{discountPercent}% OFF</span>
                </>
              )}
            </div>

            <p className="product-detail__description">{product.description}</p>

            {product.features.length > 0 && (
              <div className="product-detail__features">
                <h2>Características</h2>
                <ul>
                  {product.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              size="lg"
              className="product-detail__add"
              onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
            >
              Agregar al Carrito
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
