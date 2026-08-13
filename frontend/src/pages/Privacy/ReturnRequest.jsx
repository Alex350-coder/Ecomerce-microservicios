import React, { useState } from 'react';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import '../../styles/pages/Privacy/ReturnRequest.css';

export const ReturnRequest = () => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    productName: '',
    reason: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [receiptFile, setReceiptFile] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setReceiptFile(file);
    } else {
      alert('Por favor, sube un archivo PDF');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!receiptFile) {
      alert('Por favor, adjunta el comprobante de pago');
      return;
    }

    console.log('Solicitud de devolución:', { ...formData, receiptFile });
    alert('Solicitud de devolución enviada. Te contactaremos en 24-48 horas.');

    // Reset form
    setFormData({
      orderNumber: '',
      productName: '',
      reason: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
    });
    setReceiptFile(null);
  };

  return (
    <MainLayout>
      <div className="return-request-page">
        <div className="return-request-header">
          <h1>Solicitud de Devolución</h1>
          <p>Completa el formulario para procesar tu devolución</p>
        </div>

        <Card className="return-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Información del Pedido</h3>
              <div className="form-grid">
                <Input
                  label="Número de Pedido"
                  placeholder="Ej: ORD-123456"
                  value={formData.orderNumber}
                  onChange={(e) => handleChange('orderNumber', e.target.value)}
                  required
                />
                <Input
                  label="Nombre del Producto"
                  placeholder="Ej: iPhone 14 Pro"
                  value={formData.productName}
                  onChange={(e) => handleChange('productName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Motivo de la Devolución</h3>
              <div className="input-container">
                <label>Razón Principal</label>
                <select
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  required
                  className="reason-select"
                >
                  <option value="">Selecciona una razón</option>
                  <option value="defective">Producto defectuoso</option>
                  <option value="wrong-item">Producto incorrecto</option>
                  <option value="not-as-described">No coincide con la descripción</option>
                  <option value="change-mind">Cambio de opinión</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="input-container">
                <label>Descripción Detallada</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe el problema o razón de la devolución en detalle..."
                  rows="4"
                  required
                  className="description-textarea"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Información de Contacto</h3>
              <div className="form-grid">
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  required
                />
                <Input
                  label="Teléfono de Contacto"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Comprobante de Pago</h3>
              <div className="file-upload">
                <label className="file-label">
                  Sube tu comprobante de pago (PDF)
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <div className="file-display">
                    {receiptFile ? (
                      <span className="file-name">✓ {receiptFile.name}</span>
                    ) : (
                      <span className="file-placeholder">Seleccionar archivo PDF</span>
                    )}
                  </div>
                </label>
                <p className="file-help">Formato aceptado: PDF (máximo 5MB)</p>
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" className="submit-button">
                Enviar Solicitud de Devolución
              </Button>

              <p className="form-note">
                Al enviar este formulario, aceptas nuestra
                <a href="/privacy"> Política de Privacidad</a> y
                <a href="/terms"> Términos de Servicio</a>.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};
