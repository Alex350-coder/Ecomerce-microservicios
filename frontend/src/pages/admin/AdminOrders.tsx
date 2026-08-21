import {
  adminFetchAllOrders,
  adminUpdateOrderStatus,
  type AdminOrder,
} from '../../api/admin-orders';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import '../../styles/pages/admin/AdminTable.css';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  paid: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
  failed: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  failed: 'Fallido',
};

export function AdminOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: adminFetchAllOrders,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminUpdateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  if (isLoading) return <Spinner />;

  const orderList = orders ?? [];

  if (orderList.length === 0) {
    return (
      <div>
        <div className="admin-page-header">
          <h1>Pedidos</h1>
          <p>Gestionar pedidos de la tienda</p>
        </div>
        <EmptyState
          title="No hay pedidos"
          description="Los pedidos aparecerán aquí cuando los clientes compren."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Pedidos</h1>
        <p>Gestionar pedidos de la tienda ({orderList.length} total)</p>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orderList.map((order: AdminOrder) => (
            <tr key={order.id}>
              <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                {order.id.slice(0, 8)}...
              </td>
              <td>{order.addressSnapshot.fullName}</td>
              <td>${order.total.toFixed(2)}</td>
              <td>
                <Badge variant={STATUS_VARIANTS[order.status] ?? 'default'}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </Badge>
              </td>
              <td>{new Date(order.createdAt).toLocaleDateString('es-ES')}</td>
              <td>
                <div className="admin-actions">
                  <Link to={`/orders/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </Link>
                  {order.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('¿Marcar como pagado?')) {
                          statusMutation.mutate({ id: order.id, status: 'paid' });
                        }
                      }}
                    >
                      Marcar Pagado
                    </Button>
                  )}
                  {order.status === 'paid' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('¿Marcar como enviado?')) {
                          statusMutation.mutate({ id: order.id, status: 'shipped' });
                        }
                      }}
                    >
                      Marcar Enviado
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
