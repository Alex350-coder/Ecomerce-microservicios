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
                <Link to="/about">Sobre Nosotros</Link>
              </li>
              <li>
                <Link to="/contact">Contacto</Link>
              </li>
              <li>
                <Link to="/support">Soporte</Link>
              </li>
            </ul>
          </div>

          <div className="footer__section">
            <h4>Legal</h4>
            <ul>
              <li>
                <Link to="/privacy">Política de Privacidad</Link>
              </li>
              <li>
                <Link to="/terms">Términos de Servicio</Link>
              </li>
              <li>
                <Link to="/returns">Devoluciones</Link>
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
