import React from 'react';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import '../../styles/pages/Privacy/Returns.css';

export const Returns = () => {
  return (
    <MainLayout>
      <div className="returns-page">
        <div className="returns-header">
          <h1>Política de Devoluciones</h1>
          <p>Tu satisfacción es nuestra prioridad</p>
        </div>

        <div className="returns-content">
          <Card className="policy-card">
            <h2>📦 Política de Devoluciones</h2>

            <div className="policy-section">
              <h3>Plazo para Devoluciones</h3>
              <p>
                Aceptamos devoluciones dentro de los <strong>30 días</strong> posteriores a la
                recepción del producto.
              </p>
            </div>

            <div className="policy-section">
              <h3>Condiciones para Devoluciones</h3>
              <ul>
                <li>El producto debe estar en su estado original</li>
                <li>Debe incluir todos los accesorios y empaques</li>
                <li>No debe mostrar signos de uso o daño</li>
                <li>Se debe presentar el comprobante de compra</li>
              </ul>
            </div>

            <div className="policy-section">
              <h3>Proceso de Reembolso</h3>
              <p>
                Una vez recibido y verificado el producto, procesaremos tu reembolso dentro de{' '}
                <strong>5-7 días hábiles</strong>. El reembolso se realizará al método de pago
                original.
              </p>
            </div>

            <div className="policy-section">
              <h3>Productos No Elegibles</h3>
              <ul>
                <li>Productos de software abiertos</li>
                <li>Productos personalizados o hechos a medida</li>
                <li>Productos de higiene personal (abiertos)</li>
                <li>Tarjetas de regalo</li>
              </ul>
            </div>

            <div className="policy-actions">
              <Link to="/ReturnRequest">
                <Button variant="primary" size="lg">
                  Solicitar Devolución
                </Button>
              </Link>

              <Link to="/contact">
                <p className="contact-info">
                  ¿Tienes dudas? Contáctanos:
                  <strong> devoluciones@electroshop.com</strong>
                </p>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};
