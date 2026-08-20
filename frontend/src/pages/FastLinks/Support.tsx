import { useState } from 'react';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import '../../styles/pages/FastLinks/Suport.css';

interface Faq {
  question: string;
  answer: string;
}

const faqs: Faq[] = [
  {
    question: '¿Cuánto tiempo tarda el envío?',
    answer: 'Los envíos estándar tardan 3-5 días hábiles. Express 1-2 días.',
  },
  {
    question: '¿Hacen envíos internacionales?',
    answer: 'Sí, realizamos envíos a toda Latinoamérica con costos variables.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito/débito, PayPal y transferencias bancarias.',
  },
  {
    question: '¿Puedo cambiar mi pedido?',
    answer: 'Sí, puedes realizar cambios dentro de las primeras 24 horas después de la compra.',
  },
];

export const Support = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <MainLayout>
      <div className="support-page">
        <div className="support-header">
          <h1>Centro de Soporte</h1>
          <p>Encuentra respuestas rápidas a tus preguntas</p>
        </div>

        <div className="support-actions">
          <Card className="action-card">
            <h3>📞 Soporte Telefónico</h3>
            <p>Habla directamente con nuestro equipo</p>
            <p className="contact-info">+1 (555) 123-4567</p>
          </Card>

          <Card className="action-card">
            <h3>📧 Email de Soporte</h3>
            <p>Envíanos un correo detallado</p>
            <p className="contact-info">soporte@electroshop.com</p>
          </Card>

          <Card className="action-card">
            <h3>💬 Chat en Vivo</h3>
            <p>Conversación instantánea 24/7</p>
            <Button variant="outline" size="sm">
              Iniciar Chat
            </Button>
          </Card>
        </div>

        <div className="faq-section">
          <h2>Preguntas Frecuentes</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <Card key={index} className="faq-item">
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <h4>{faq.question}</h4>
                  <span className="faq-toggle">{activeFaq === index ? '−' : '+'}</span>
                </div>
                {activeFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="support-links">
          <Card className="links-card">
            <h3>Enlaces Rápidos</h3>
            <div className="links-grid">
              <Link to="/returns" className="support-link">
                Política de Devoluciones
              </Link>
              <Link to="/privacy" className="support-link">
                Política de Privacidad
              </Link>
              <Link to="/terms" className="support-link">
                Términos de Servicio
              </Link>
              <Link to="/contact" className="support-link">
                Formulario de Contacto
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};
