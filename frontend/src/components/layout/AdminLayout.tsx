import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import '../../styles/layout/AdminLayout.css';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout">
      <button
        className="admin-hamburger"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={sidebarOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <h2>ElectroShop</h2>
          <p>Panel de Administración</p>
        </div>

        <nav className="admin-sidebar__nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            📦 Productos
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            🧾 Pedidos
          </NavLink>
          <NavLink
            to="/admin/inventory"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            📋 Inventario
          </NavLink>
        </nav>

        <div className="admin-sidebar__footer">
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            {user?.email}
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <NavLink to="/" className="admin-sidebar__link">
              ← Volver a la tienda
            </NavLink>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
