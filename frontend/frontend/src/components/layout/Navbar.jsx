import React from 'react';
import { Button } from '../ui/Button';
import '../../styles/layout/Navbar.css';

export const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Button variant="ghost" size="sm">🏠 Inicio</Button>
        <Button variant="ghost" size="sm">📱 Smartphones</Button>
        <Button variant="ghost" size="sm">💻 Laptops</Button>
        <Button variant="ghost" size="sm">🎧 Audio</Button>
        <Button variant="ghost" size="sm">⌚ Wearables</Button>
        <Button variant="ghost" size="sm">🔌 Accesorios</Button>
      </div>
    </nav>
  );
};