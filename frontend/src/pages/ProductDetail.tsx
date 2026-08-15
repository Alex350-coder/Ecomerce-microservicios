import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import '../styles/pages/Home.css';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  return (
    <MainLayout>
      <div className="product-detail">
        <Card className="product-detail__card">
          <h1>Producto #{id}</h1>
          <p>Los detalles del producto se mostrarán cuando el catálogo esté disponible.</p>
          <Button
            variant="primary"
            onClick={() => addItem({ id: id ?? 'demo', name: `Producto #${id}`, price: 100 })}
          >
            Agregar al carrito (demo)
          </Button>
          <Link to="/products">
            <Button variant="ghost">Volver</Button>
          </Link>
        </Card>
      </div>
    </MainLayout>
  );
};
