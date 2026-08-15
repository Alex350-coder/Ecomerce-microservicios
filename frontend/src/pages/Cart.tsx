import { Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import '../styles/pages/Checkout.css';

export const Cart = () => {
  const { items, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  return (
    <MainLayout>
      <div className="cart-page">
        <h1>Mi Carrito</h1>

        {items.length === 0 ? (
          <Card className="empty-state">
            <p>Tu carrito está vacío.</p>
            <Link to="/products">
              <Button variant="primary">Ver productos</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="cart-list">
              {items.map((item) => (
                <Card key={item.id} className="cart-row">
                  <div className="cart-row__info">
                    <h3>{item.name}</h3>
                    <span>${item.price}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    aria-label={`Cantidad de ${item.name}`}
                  />
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                  <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                    Quitar
                  </Button>
                </Card>
              ))}
            </div>

            <div className="cart-footer">
              <strong>Total: ${totalPrice.toFixed(2)}</strong>
              <Link to="/checkout">
                <Button variant="primary">Proceder al Pago</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Vaciar carrito
              </Button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};
