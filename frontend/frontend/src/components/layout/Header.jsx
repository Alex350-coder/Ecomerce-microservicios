import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Navbar } from './Navbar';  // ← Importar Navbar aquí
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
            <Button variant="ghost" size="sm">
              🛒 Carrito
            </Button>
            <Button variant="ghost" size="sm">
              👤 Cuenta
            </Button>
            <Button variant="outline" size="sm">
              Login
            </Button>
            <Button variant="primary" size="sm">
              Registrarse
            </Button>
          </nav>
        </div>
      </header>

      {/* Navbar integrado */}
      <Navbar />
    </div>
  );
};