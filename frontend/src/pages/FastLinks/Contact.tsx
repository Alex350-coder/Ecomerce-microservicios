import { useState, type FormEvent } from 'react';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import '../../styles/pages/FastLinks/Contact.css';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const Contact = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = <K extends keyof ContactForm>(field: K, value: ContactForm[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Formulario contacto:', formData);
    alert('¡Mensaje enviado! Te contactaremos pronto.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <MainLayout>
      <div className="contact-page">
        <div className="contact-header">
          <h1>Contáctanos</h1>
          <p>Estamos aquí para ayudarte</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <Card className="info-card">
              <h2>Información de Contacto</h2>

              <div className="contact-method">
                <h3>📧 Email</h3>
                <p>soporte@electroshop.com</p>
              </div>

              <div className="contact-method">
                <h3>📞 Teléfono</h3>
                <p>+1 (555) 123-4567</p>
              </div>

              <div className="contact-method">
                <h3>🕒 Horario de Atención</h3>
                <p>Lunes a Viernes: 9:00 - 18:00</p>
                <p>Sábados: 10:00 - 14:00</p>
              </div>

              <div className="contact-method">
                <h3>🏢 Dirección</h3>
                <p>Calle Tecnología 123</p>
                <p>Ciudad Digital, CP 12345</p>
              </div>
            </Card>
          </div>

          <div className="contact-form">
            <Card className="form-card">
              <h2>Envíanos un Mensaje</h2>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <Input
                    label="Nombre Completo"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                  <Input
                    label="Correo Electrónico"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Asunto"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  required
                />

                <div className="input-container">
                  <label>Mensaje</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={6}
                    required
                    className="message-textarea"
                  />
                </div>

                <Button type="submit" className="submit-button">
                  Enviar Mensaje
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
