import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders, cancelOrder, type OrderDto } from '../api/orders';
import '../styles/pages/Orders.css';

const STATUS_LABELS: Record<OrderDto['status'], string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  failed: 'Fallido',
};

const STATUS_COLORS: Record<OrderDto['status'], string> = {
  pending: 'status-pending',
  paid: 'status-paid',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
  failed: 'status-failed',
};

export const Orders = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { message?: string })?.message ?? null,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar pedidos';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [isAuthenticated]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Seguro que deseas cancelar este pedido?')) return;

    try {
      const updated = await cancelOrder(orderId, 'Cancelado por el usuario');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSuccessMessage('Pedido cancelado correctamente');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cancelar pedido';
      setError(message);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="orders-page">
          <Card className="empty-state">
            <p>Inicia sesion para ver tus pedidos.</p>
            <Link to="/login">
              <Button variant="primary">Iniciar sesion</Button>
            </Link>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="orders-page orders-loading">
          <Spinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="orders-page">
        <h1>Mis Pedidos</h1>

        {successMessage && (
          <div className="orders-success" role="status">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="orders-error" role="alert">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <Card className="empty-state">
            <p>Aun no tienes pedidos.</p>
            <Link to="/products">
              <Button variant="primary">Explorar productos</Button>
            </Link>
          </Card>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Card key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-meta">
                    <span className="order-id">Pedido #{order.id.slice(0, 8)}</span>
                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                  <span className={`order-status ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <span className="item-name">{item.productName}</span>
                      <span className="item-qty">x{item.quantity}</span>
                      <span className="item-price">${item.lineTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <span className="order-total">
                    Total: <strong>${order.total.toFixed(2)}</strong>
                  </span>
                  <div className="order-actions">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="secondary" size="sm">Ver detalle</Button>
                    </Link>
                    {order.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => void handleCancelOrder(order.id)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
