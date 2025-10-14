import React from 'react';
import '../../styles/layout/Footer.css';

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
              <li><a href="/about">Sobre Nosotros</a></li>
              <li><a href="/contact">Contacto</a></li>
              <li><a href="/support">Soporte</a></li>
            </ul>
          </div>
          
          <div className="footer__section">
            <h4>Legal</h4>
            <ul>
              <li><a href="/privacy">Política de Privacidad</a></li>
              <li><a href="/terms">Términos de Servicio</a></li>
              <li><a href="/returns">Devoluciones</a></li>
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