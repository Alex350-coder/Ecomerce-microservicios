import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useCart } from '../context/CartContext';
import { fetchProducts, formatPrice, type Product } from '../api/products';
import '../styles/pages/Home.css';

export const Home = () => {
  const { addItem } = useCart();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchProducts({ isFeatured: true, sort: 'rating', limit: 3 }),
  });

  const featuredProducts: Product[] = data?.data ?? [];

  const handleAddToCart = (product: Product) => {
    addItem({ id: product.id, name: product.name, price: product.price });
  };

  return (
    <MainLayout>
      <div className="home">
        <section className="hero">
          <div className="hero__content">
            <h1 className="hero__title">
              Descubre la <span className="hero__accent">Tecnología</span> del Futuro
            </h1>
            <p className="hero__description">
              Encuentra los mejores productos electrónicos con precios increíbles y envío rápido.
            </p>
            <div className="hero__actions">
              <Link to="/products">
                <Button size="lg">Comprar Ahora</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="featured">
          <h2 className="featured__title">Productos Destacados</h2>

          {isLoading && <Spinner label="Cargando productos..." />}

          {isError && (
            <div className="no-products">
              <p>No se pudieron cargar los productos destacados.</p>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="featured__grid">
              {featuredProducts.map((product) => (
                <Card key={product.id} hover className="product-card">
                  <div className="product-card__image">
                    <Link to={`/products/${product.id}`} aria-label={product.name}>
                      <img src={product.images[0] ?? ''} alt={product.name} loading="lazy" />
                    </Link>
                  </div>
                  <div className="product-card__content">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="product-card__name">{product.name}</h3>
                    </Link>
                    <div className="product-card__rating">
                      <span className="stars">{'★'.repeat(Math.floor(product.rating ?? 0))}</span>
                      <span>({product.rating ?? 'Sin valoraciones'})</span>
                    </div>
                    <div className="product-card__footer">
                      <span className="product-card__price">{formatPrice(product.price)}</span>
                      <Button size="sm" onClick={() => handleAddToCart(product)}>
                        Agregar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};
