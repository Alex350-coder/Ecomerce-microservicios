import { Button } from './Button';
import { Card } from './Card';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../styles/ui/CartDropdown.css';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDropdown = ({ isOpen, onClose }: CartDropdownProps) => {
  const { items, totalItems, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className="cart-dropdown-overlay" onClick={onClose}>
      <div className="cart-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>Carrito de Compras {totalItems > 0 ? `(${totalItems})` : ''}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="items-list">
              {items.map((item) => (
                <Card key={item.productId} className="cart-item">
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <div className="item-price">${item.price.toFixed(2)}</div>
                    <div className="item-quantity">
                      <span>Cantidad: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-amount">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="cart-actions">
              <Button variant="outline" size="sm" onClick={onClose}>
                Seguir Comprando
              </Button>
              <Link to="/checkout" onClick={onClose}>
                <Button variant="primary" size="sm">
                  Proceder al Pago
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
