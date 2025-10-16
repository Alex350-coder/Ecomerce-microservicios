import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Navbar } from './Navbar'; 
import { CartIcon } from '../ui/CartIcon'; 
import { Link } from 'react-router-dom';
import '../../styles/layout/Header.css';

export const Header = () => {
  return (
    <div className="header-container">  {/* ← Nuevo contenedor */}
      {/* Sección superior del Header */}
      <header className="header-main">
        <div className="header__container">
          {/* Logo */}
          <div className="header__logo">
            <div className="logo__icon">E</div>
            <span className="logo__text">ElectroShop</span>
          </div>

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
          </nav>
        </div>
      </header>

      {/* Navbar integrado */}
      <Navbar />
    </div>
  );
};