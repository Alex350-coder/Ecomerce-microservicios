import { useQuery } from '@tanstack/react-query';
import { adminFetchProducts } from '../../api/admin';
import { adminFetchAllOrders } from '../../api/admin-orders';
import '../../styles/pages/admin/Dashboard.css';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-card__icon">{icon}</span>
      <span className="admin-stat-card__value">{value}</span>
      <span className="admin-stat-card__label">{label}</span>
    </div>
  );
}

export function AdminDashboard() {
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => adminFetchProducts({ limit: 1 }),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-count'],
    queryFn: () => adminFetchAllOrders(),
  });

  const totalOrders = orders?.length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === 'pending').length ?? 0;
  const totalRevenue =
    orders?.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0) ?? 0;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Vista general de la tienda</p>
      </div>

      <div className="admin-dashboard">
        <StatCard
          icon="📦"
          value={productsLoading ? '...' : (productsData?.meta.total ?? 0)}
          label="Productos"
        />
        <StatCard icon="🧾" value={ordersLoading ? '...' : totalOrders} label="Pedidos Totales" />
        <StatCard
          icon="⏳"
          value={ordersLoading ? '...' : pendingOrders}
          label="Pedidos Pendientes"
        />
        <StatCard
          icon="💰"
          value={ordersLoading ? '...' : `$${totalRevenue.toFixed(2)}`}
          label="Ingresos Totales"
        />
      </div>
    </div>
  );
}
