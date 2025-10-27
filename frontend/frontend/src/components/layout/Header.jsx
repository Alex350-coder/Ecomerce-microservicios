import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Navbar } from './Navbar'; 
import { CartIcon } from '../ui/CartIcon'; 
import { Link } from 'react-router-dom';
import '../../styles/layout/Header.css';

export const Header = () => {
  // 🆕 Verificar si el usuario está logueado
  const isLoggedIn = !!localStorage.getItem('token');
  const userData = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  
  // 🆕 Obtener nombre para mostrar
  const getUserDisplayName = () => {
    if (!userData) return 'Usuario';
    
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    } else if (userData.firstName) {
      return userData.firstName;
    } else if (userData.email) {
      return userData.email.split('@')[0];
    }
    
    return 'Usuario';
  };

  // 🆕 Manejar logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); // Recargar para actualizar la UI
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
          <div className="header__search">
            <Input
              type="text"
              placeholder="Buscar productos..."
              className="search-input"
            />
          </div>

          {/* Navegación */}
          <nav className="header__nav">
            <CartIcon />
            
            {isLoggedIn ? (
              // 🆕 MENÚ PARA USUARIO LOGUEADO
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
                  <button 
                    onClick={handleLogout}
                    className="dropdown-item logout-button"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              // 🆕 BOTONES PARA USUARIO NO LOGUEADO
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