import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../styles/ui/CartDropdown.css';

export const CartDropdown = ({ isOpen, onClose }) => {
  const { items, totalPrice } = useCart();

  const calculateTotal = () => {
    return totalPrice;
  };

  if (!isOpen) return null;

  return (
    <div className="cart-dropdown-overlay" onClick={onClose}>
      <div className="cart-dropdown" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <h3>Carrito de Compras</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Lista de Productos */}
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="items-list">
              {items.map((item) => (
                <Card key={item.id} className="cart-item">
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <div className="item-price">${item.price}</div>
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

        {/* Footer con Total y Acciones */}
        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-amount">${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="cart-actions">
              <Button variant="outline" size="sm" onClick={onClose}>
                Seguir Comprando
              </Button>
              <Link to="/checkout">
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
