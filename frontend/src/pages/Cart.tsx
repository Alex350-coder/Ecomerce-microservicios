import { Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import '../styles/pages/Checkout.css';

export const Cart = () => {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart, isLoading } = useCart();

  return (
    <MainLayout>
      <div className="cart-page">
        <h1>Mi Carrito{totalItems > 0 ? ` (${totalItems})` : ''}</h1>

        {isLoading && <p>Cargando carrito...</p>}

        {!isLoading && items.length === 0 ? (
          <Card className="empty-state">
            <p>Tu carrito está vacío.</p>
            <Link to="/products">
              <Button variant="primary">Ver productos</Button>
            </Link>
          </Card>
        ) : (
          !isLoading && (
            <>
              <div className="cart-list">
                {items.map((item) => (
                  <Card key={item.productId} className="cart-row">
                    <div className="cart-row__info">
                      <h3>{item.name}</h3>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                      aria-label={`Cantidad de ${item.name}`}
                    />
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                    <Button variant="outline" size="sm" onClick={() => removeItem(item.productId)}>
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
          )
        )}
      </div>
    </MainLayout>
  );
};
