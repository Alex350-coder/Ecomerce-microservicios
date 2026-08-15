import React, { useState } from 'react';
import { Button } from './Button';
import { CartDropdown } from './CartDropdown';
import { useCart } from '../../context/CartContext';
import '../../styles/ui/CartIcon.css';

export const CartIcon = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="cart-icon-button"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Abrir carrito (${totalItems} artículos)`}
      >
        🛒
        {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
      </Button>

      <CartDropdown isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
