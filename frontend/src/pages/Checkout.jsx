import React, { useState } from 'react';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import '../styles/pages/Checkout.css';

export const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  // Datos de ejemplo del carrito
  const cartItems = [
    {
      id: 1,
      name: 'iPhone 14 Pro',
      price: 999,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=80&h=80&fit=crop',
    },
    {
      id: 2,
      name: 'AirPods Pro',
      price: 249,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b80b4cb5b434?w=80&h=80&fit=crop',
    },
    {
      id: 3,
      name: 'MacBook Pro 14"',
      price: 1999,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=80&h=80&fit=crop',
    },
  ];

  const shippingMethods = [
    { id: 'standard', name: 'Envío Estándar', price: 5.99, days: '5-7 días' },
    { id: 'express', name: 'Envío Express', price: 12.99, days: '2-3 días' },
    { id: 'priority', name: 'Envío Prioritario', price: 24.99, days: '1 día' },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingMethods.find((method) => method.id === shippingMethod)?.price || 0;
  const tax = subtotal * 0.08; // 8% de impuesto
  const total = subtotal + shippingCost + tax;

  const handleCardChange = (field, value) => {
    setCardData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica de procesamiento de pago
    console.log('Procesando pago...', { paymentMethod, cardData, total });
    alert('¡Pedido procesado con éxito!');
  };

  return (
    <MainLayout>
      <div className="checkout-page">
        <div className="checkout-header">
          <h1>Finalizar Compra</h1>
          <nav className="checkout-steps">
            <span className="step active">Carrito</span>
            <span className="step active">Información</span>
            <span className="step active">Pago</span>
            <span className="step">Confirmación</span>
          </nav>
        </div>

        <div className="checkout-content">
          {/* Columna izquierda - Formularios */}
          <div className="checkout-forms">
            {/* Información de Envío */}
            <Card className="checkout-section">
              <h2>Información de Envío</h2>
              <div className="form-grid">
                <Input label="Nombre Completo" placeholder="Juan Pérez" required />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="juan@email.com"
                  required
                />
                <Input label="Teléfono" placeholder="+1 234 567 8900" required />
                <Input label="Dirección" placeholder="Calle Principal 123" required />
                <Input label="Ciudad" placeholder="Ciudad" required />
                <Input label="Código Postal" placeholder="12345" required />
                <Input label="País" placeholder="País" required />
              </div>
            </Card>

            {/* Método de Envío */}
            <Card className="checkout-section">
              <h2>Método de Envío</h2>
              <div className="shipping-methods">
                {shippingMethods.map((method) => (
                  <label key={method.id} className="shipping-method">
                    <input
                      type="radio"
                      name="shipping"
                      value={method.id}
                      checked={shippingMethod === method.id}
                      onChange={(e) => setShippingMethod(e.target.value)}
                    />
                    <div className="method-info">
                      <span className="method-name">{method.name}</span>
                      <span className="method-details">
                        {method.days} • ${method.price}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Método de Pago */}
            <Card className="checkout-section">
              <h2>Método de Pago</h2>

              <div className="payment-methods">
                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment"
                    value="credit-card"
                    checked={paymentMethod === 'credit-card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  💳 Tarjeta de Crédito/Débito
                </label>

                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  🅿️ PayPal
                </label>

                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  🏦 Transferencia Bancaria
                </label>
              </div>

              {paymentMethod === 'credit-card' && (
                <div className="card-form">
                  <div className="form-grid">
                    <Input
                      label="Número de Tarjeta"
                      placeholder="1234 5678 9012 3456"
                      value={cardData.number}
                      onChange={(e) => handleCardChange('number', e.target.value)}
                      required
                    />
                    <Input
                      label="Nombre en la Tarjeta"
                      placeholder="JUAN PEREZ"
                      value={cardData.name}
                      onChange={(e) => handleCardChange('name', e.target.value)}
                      required
                    />
                    <Input
                      label="Fecha de Expiración"
                      placeholder="MM/AA"
                      value={cardData.expiry}
                      onChange={(e) => handleCardChange('expiry', e.target.value)}
                      required
                    />
                    <Input
                      label="CVV"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => handleCardChange('cvv', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="paypal-info">
                  <p>Serás redirigido a PayPal para completar tu pago de forma segura.</p>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="transfer-info">
                  <p>Realiza la transferencia a:</p>
                  <div className="bank-details">
                    <p>
                      <strong>Banco:</strong> ElectroShop Bank
                    </p>
                    <p>
                      <strong>Cuenta:</strong> 1234-5678-9012-3456
                    </p>
                    <p>
                      <strong>Beneficiario:</strong> ElectroShop Inc.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Columna derecha - Resumen */}
          <div className="checkout-summary">
            <Card className="summary-card">
              <h2>Resumen del Pedido</h2>

              {/* Productos */}
              <div className="summary-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="summary-item">
                    <img src={item.image} alt={item.name} />
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">Cantidad: {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="summary-totals">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Envío:</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Impuestos (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="total-line grand-total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Términos y Botón */}
              <div className="summary-actions">
                <label className="terms-agreement">
                  <input type="checkbox" required />
                  Acepto los <a href="/terms">términos y condiciones</a> y la{' '}
                  <a href="/privacy">política de privacidad</a>
                </label>

                <Button className="checkout-button" size="lg" onClick={handleSubmit}>
                  Completar Pedido - ${total.toFixed(2)}
                </Button>

                <Link to="/cart" className="back-to-cart">
                  ← Volver al Carrito
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
