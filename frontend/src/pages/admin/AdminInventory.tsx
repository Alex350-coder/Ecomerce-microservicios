import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetchInventory, adminAdjustStock } from '../../api/admin-inventory';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import '../../styles/pages/admin/AdminTable.css';

export function AdminInventory() {
  const queryClient = useQueryClient();
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState(0);

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: adminFetchInventory,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ productId, adj }: { productId: string; adj: number }) =>
      adminAdjustStock(productId, adj),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      setAdjustingId(null);
      setAdjustment(0);
    },
  });

  if (isLoading) return <Spinner />;

  const inventory = items ?? [];

  if (inventory.length === 0) {
    return (
      <div>
        <div className="admin-page-header">
          <h1>Inventario</h1>
          <p>Gestionar stock de productos</p>
        </div>
        <EmptyState
          title="Sin inventario"
          description="El inventario se creará automáticamente al agregar productos."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Inventario</h1>
        <p>Gestionar stock de productos ({inventory.length} items)</p>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Stock</th>
            <th>Reservado</th>
            <th>Disponible</th>
            <th>Estado</th>
            <th>Ajustar</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td>{item.productName}</td>
              <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{item.sku}</td>
              <td>{item.stock}</td>
              <td>{item.reservedStock}</td>
              <td>{item.availableStock}</td>
              <td>
                <Badge variant={item.isLowStock ? 'error' : 'success'}>
                  {item.isLowStock ? 'Stock Bajo' : 'OK'}
                </Badge>
              </td>
              <td>
                {adjustingId === item.id ? (
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        adjustMutation.mutate({ productId: item.productId, adj: adjustment })
                      }
                    >
                      OK
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAdjustingId(null)}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAdjustingId(item.id);
                      setAdjustment(0);
                    }}
                  >
                    Ajustar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
