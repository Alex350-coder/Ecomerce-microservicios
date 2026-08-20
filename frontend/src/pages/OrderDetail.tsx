import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { fetchOrderById, cancelOrder, type OrderDto } from '../api/orders';
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

export const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOrderById(id);
        setOrder(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar el pedido';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [id, isAuthenticated]);

  const handleCancel = async () => {
    if (!id || !window.confirm('Seguro que deseas cancelar este pedido?')) return;

    try {
      const updated = await cancelOrder(id, 'Cancelado por el usuario');
      setOrder(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cancelar pedido';
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="orders-page orders-loading">
          <Spinner />
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="orders-page">
          <Card className="empty-state">
            <p>{error ?? 'Pedido no encontrado'}</p>
            <Link to="/orders">
              <Button variant="primary">Volver a mis pedidos</Button>
            </Link>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="orders-page">
        <div className="order-detail-header">
          <Link to="/orders" className="back-link">
            Volver a pedidos
          </Link>
          <h1>Pedido #{order.id.slice(0, 8)}</h1>
          <span className={`order-status ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {error && (
          <div className="orders-error" role="alert">
            {error}
          </div>
        )}

        <div className="order-detail-content">
          <Card className="order-detail-section">
            <h2>Productos</h2>
            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <span className="item-name">{item.productName}</span>
                    <span className="item-qty">
                      x{item.quantity} a ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="item-price">${item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="order-detail-grid">
            <Card className="order-detail-section">
              <h2>Direccion de envio</h2>
              {order.addressSnapshot && (
                <div className="address-info">
                  <p>
                    <strong>{order.addressSnapshot.fullName}</strong>
                  </p>
                  <p>{order.addressSnapshot.address}</p>
                  <p>
                    {order.addressSnapshot.city}, {order.addressSnapshot.postalCode}
                  </p>
                  <p>{order.addressSnapshot.country}</p>
                  <p>
                    {order.addressSnapshot.email} - {order.addressSnapshot.phone}
                  </p>
                </div>
              )}
            </Card>

            <Card className="order-detail-section">
              <h2>Resumen de pago</h2>
              <div className="summary-totals">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Envio ({order.shippingMethod}):</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Impuestos:</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="total-line grand-total">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {order.status === 'pending' && (
            <div className="order-detail-actions">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar pedido
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
