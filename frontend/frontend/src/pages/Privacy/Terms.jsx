import React from 'react';
import { MainLayout } from '../../templates/MainLayout';
import { Card } from '../../components/ui/Card';
import '../../styles/pages/Privacy/Terms.css';

export const Terms = () => {
  return (
    <MainLayout>
      <div className="terms-page">
        <div className="terms-header">
          <h1>Términos de Servicio</h1>
          <p>Por favor, lee detenidamente estos términos antes de usar nuestros servicios</p>
        </div>

        <Card className="terms-content">
          <section className="terms-section">
            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar ElectroShop, aceptas estar sujeto a estos 
              Términos de Servicio y a nuestra Política de Privacidad.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Cuenta de Usuario</h2>
            <p>
              Eres responsable de mantener la confidencialidad de tu cuenta y 
              contraseña, y de restringir el acceso a tu computadora.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. Productos y Precios</h2>
            <p>
              Nos reservamos el derecho de modificar o descontinuar productos 
              en cualquier momento. Los precios están sujetos a cambios sin 
              previo aviso.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Pagos y Facturación</h2>
            <p>
              Todos los pagos se procesan de forma segura. Aceptamos los métodos 
              de pago especificados en nuestro sitio web.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. Envíos y Entregas</h2>
            <p>
              Los tiempos de envío son estimados y pueden variar. No nos hacemos 
              responsables por retrasos causados por el transportista.
            </p>
          </section>

          <section className="terms-section">
            <h2>6. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de ElectroShop, incluyendo logotipos, textos y 
              diseños, está protegido por derechos de autor.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Limitación de Responsabilidad</h2>
            <p>
              ElectroShop no será responsable por daños indirectos, incidentales 
              o consecuentes resultantes del uso de nuestros servicios.
            </p>
          </section>

          <section className="terms-section">
            <h2>8. Cambios en los Términos</h2>
            <p>
              Podemos actualizar estos términos periódicamente. Te notificaremos 
              sobre cambios significativos.
            </p>
          </section>
        </Card>
      </div>
    </MainLayout>
  );
};