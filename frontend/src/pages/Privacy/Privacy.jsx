import React from 'react';
import { MainLayout } from '../../templates/MainLayout';
import { Card } from '../../components/ui/Card';
import '../../styles/pages/Privacy/Privacy.css';

export const Privacy = () => {
  return (
    <MainLayout>
      <div className="privacy-page">
        <div className="privacy-header">
          <h1>Política de Privacidad</h1>
          <p>Última actualización: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="privacy-content">
          <section className="privacy-section">
            <h2>1. Información que Recopilamos</h2>
            <p>Recopilamos información que nos proporcionas directamente, incluyendo:</p>
            <ul>
              <li>Nombre y información de contacto</li>
              <li>Información de pago y facturación</li>
              <li>Direcciones de envío</li>
              <li>Comunicaciones con nuestro servicio al cliente</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>2. Uso de la Información</h2>
            <p>Utilizamos tu información para:</p>
            <ul>
              <li>Procesar tus pedidos y pagos</li>
              <li>Gestionar tu cuenta de usuario</li>
              <li>Enviar actualizaciones sobre tus pedidos</li>
              <li>Mejorar nuestros servicios y experiencia de usuario</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. Protección de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu
              información personal contra accesos no autorizados, alteración, divulgación o
              destrucción.
            </p>
          </section>

          <section className="privacy-section">
            <h2>4. Cookies y Tecnologías Similares</h2>
            <p>
              Utilizamos cookies para mejorar tu experiencia en nuestro sitio web, recordar tus
              preferencias y analizar el tráfico del sitio.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Tus Derechos</h2>
            <p>
              Tienes derecho a acceder, corregir o eliminar tu información personal. Puedes ejercer
              estos derechos contactándonos a través de nuestro formulario de contacto.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política de privacidad, contáctanos en:
              <strong> privacidad@electroshop.com</strong>
            </p>
          </section>
        </Card>
      </div>
    </MainLayout>
  );
};
