import { Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import '../styles/pages/Checkout.css';

export const Orders = () => {
  return (
    <MainLayout>
      <div className="orders-page">
        <h1>Mis Pedidos</h1>
        <Card className="empty-state">
          <p>Aún no tienes pedidos.</p>
          <Link to="/products">
            <Button variant="primary">Explorar productos</Button>
          </Link>
        </Card>
      </div>
    </MainLayout>
  );
};
