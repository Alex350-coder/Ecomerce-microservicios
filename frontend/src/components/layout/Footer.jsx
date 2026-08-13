import React from 'react';
import '../../styles/layout/Footer.css';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <div className="footer__section">
            <h3>ElectroShop</h3>
            <p>Tu tienda de confianza para tecnología de última generación.</p>
          </div>
          
          <div className="footer__section">
            <h4>Enlaces Rápidos</h4>
            <ul>
              <li>
                <Link to="/About">
                <a href="/about">Sobre Nosotros</a>
                </Link>
              </li>
              <li>
                <Link to="/Contact">
                <a href="/contact">Contacto</a>
                </Link>
              </li>
              <li>
                <Link to="/Support">
                <li><a href="/support">Soporte</a></li>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="footer__section">
            <h4>Legal</h4>
            <ul>
              <li>
                <Link to="/Privacy">
                <a href="/privacy">Política de Privacidad</a>
                </Link>
              </li><li>
                <Link to="/Terms">
                <a href="/terms">Términos de Servicio</a>
                </Link>
              </li><li>
                <Link to="/Returns">
                <a href="/returns">Devoluciones</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="footer__bottom">
          <p>&copy; 2024 ElectroShop. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};