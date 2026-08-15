import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Navbar } from './Navbar';
import { CartIcon } from '../ui/CartIcon';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/layout/Header.css';

export const Header = () => {
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener nombre para mostrar
  const getUserDisplayName = () => {
    if (!user) return 'Usuario';

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Usuario';
  };

  // Manejar logout
  const handleLogout = async () => {
    await logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      window.location.href = `/products?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div className="header-container">
      {/* Sección superior del Header */}
      <header className="header-main">
        <div className="header__container">
          {/* Logo */}
          <Link to="/">
            <div className="header__logo">
              <div className="logo__icon">E</div>
              <span className="logo__text">ElectroShop</span>
            </div>
          </Link>

          {/* Barra de búsqueda */}
          <form className="header__search" onSubmit={handleSearch} role="search">
            <Input
              type="text"
              placeholder="Buscar productos..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar productos"
            />
          </form>

          {/* Navegación */}
          <nav className="header__nav">
            <CartIcon />

            {isInitializing ? null : isAuthenticated ? (
              // MENÚ PARA USUARIO LOGUEADO
              <div className="user-menu">
                <Link to="/account">
                  <Button variant="ghost" size="sm" className="user-button">
                    👤 {getUserDisplayName()}
                  </Button>
                </Link>
                <div className="user-dropdown">
                  <Link to="/account" className="dropdown-item">
                    Mi Cuenta
                  </Link>
                  <Link to="/orders" className="dropdown-item">
                    Mis Pedidos
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout-button">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              // BOTONES PARA USUARIO NO LOGUEADO
              <>
                <Link to="/account">
                  <Button variant="ghost" size="sm">
                    👤 Cuenta
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Navbar integrado */}
      <Navbar />
    </div>
  );
};
