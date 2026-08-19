import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, type OrderAddress } from '../api/orders';
import '../styles/pages/Checkout.css';

interface AddressForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

const SHIPPING_METHODS = [
  { id: 'standard', name: 'Envio Estandar', price: 5.99, days: '5-7 dias' },
  { id: 'express', name: 'Envio Express', price: 12.99, days: '2-3 dias' },
  { id: 'priority', name: 'Envio Prioritario', price: 24.99, days: '1 dia' },
];

export const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [address, setAddress] = useState<AddressForm>({
    fullName: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
    email: user?.email ?? '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingCost = SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.price ?? 0;
  const tax = totalPrice * 0.08;
  const total = totalPrice + shippingCost + tax;

  const handleAddressChange = (field: keyof AddressForm, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = useMemo(() => {
    const required: (keyof AddressForm)[] = ['fullName', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
    return required.every((f) => address[f].trim().length > 0);
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('El carrito esta vacio');
      return;
    }
    if (!isFormValid) {
      setError('Completa todos los campos de envio');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        address: address as OrderAddress,
        shippingMethod,
        idempotencyKey: `checkout-${Date.now()}-${user?.id ?? 'guest'}`,
      });

      await clearCart();
      navigate(`/orders/${order.id}`, {
        state: { message: 'Pedido creado correctamente' },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pedido';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <MainLayout>
        <div className="checkout-page">
          <Card className="empty-state">
            <p>Tu carrito esta vacio. Agrega productos antes de continuar.</p>
            <Link to="/products">
              <Button variant="primary">Explorar productos</Button>
            </Link>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="checkout-page">
        <div className="checkout-header">
          <h1>Finalizar Compra</h1>
          <nav className="checkout-steps">
            <span className="step active">Carrito</span>
            <span className="step active">Informacion</span>
            <span className="step active">Pago</span>
            <span className="step">Confirmacion</span>
          </nav>
        </div>

        {error && (
          <div className="checkout-error" role="alert">
            {error}
          </div>
        )}

        <div className="checkout-content">
          <div className="checkout-forms">
            <Card className="checkout-section">
              <h2>Informacion de Envio</h2>
              <div className="form-grid">
                <Input label="Nombre Completo" placeholder="Juan Perez" value={address.fullName} onChange={(e) => handleAddressChange('fullName', e.target.value)} required />
                <Input label="Correo Electronico" type="email" placeholder="juan@email.com" value={address.email} onChange={(e) => handleAddressChange('email', e.target.value)} required />
                <Input label="Telefono" placeholder="+34 600 000 000" value={address.phone} onChange={(e) => handleAddressChange('phone', e.target.value)} required />
                <Input label="Direccion" placeholder="Calle Principal 123" value={address.address} onChange={(e) => handleAddressChange('address', e.target.value)} required />
                <Input label="Ciudad" placeholder="Madrid" value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} required />
                <Input label="Codigo Postal" placeholder="28001" value={address.postalCode} onChange={(e) => handleAddressChange('postalCode', e.target.value)} required />
                <Input label="Pais" placeholder="Espana" value={address.country} onChange={(e) => handleAddressChange('country', e.target.value)} required />
              </div>
            </Card>

            <Card className="checkout-section">
              <h2>Metodo de Envio</h2>
              <div className="shipping-methods">
                {SHIPPING_METHODS.map((method) => (
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
                      <span className="method-details">{method.days} - ${method.price.toFixed(2)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          <div className="checkout-summary">
            <Card className="summary-card">
              <h2>Resumen del Pedido</h2>

              <div className="summary-items">
                {items.map((item) => (
                  <div key={item.productId} className="summary-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Envio:</span>
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

              <div className="summary-actions">
                <Button
                  className="checkout-button"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? <Spinner /> : `Completar Pedido - $${total.toFixed(2)}`}
                </Button>

                <Link to="/cart" className="back-to-cart">
                  Volver al Carrito
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
