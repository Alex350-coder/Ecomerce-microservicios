import { Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useCart } from '../context/CartContext';
import '../styles/pages/Checkout.css';

export const Cart = () => {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart, isLoading } =
    useCart();

  return (
    <MainLayout>
      <div className="cart-page">
        <h1>Mi Carrito{totalItems > 0 ? ` (${totalItems})` : ''}</h1>

        {isLoading && (
          <div className="cart-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="cart-row">
                <div className="cart-row__info">
                  <Skeleton variant="title" width="60%" />
                  <Skeleton variant="text" width="30%" />
                </div>
                <Skeleton variant="button" width="60px" />
                <Skeleton variant="text" width="50px" />
                <Skeleton variant="button" width="70px" />
              </Card>
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Tu carrito está vacío"
            description="Agrega productos para comenzar tu compra."
            action={
              <Link to="/products">
                <Button variant="primary">Ver productos</Button>
              </Link>
            }
          />
        ) : (
          !isLoading && (
            <>
              <div className="cart-list">
                {items.map((item) => (
                  <Card key={item.productId} className="cart-row">
                    <div className="cart-row__info">
                      <h3>{item.name}</h3>
                      <span className="cart-row__price">${item.price.toFixed(2)}</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                      aria-label={`Cantidad de ${item.name}`}
                    />
                    <span className="cart-row__subtotal">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
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
