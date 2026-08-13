import React, { useState } from 'react';
import { Button } from './Button';
import { CartDropdown } from './CartDropdown';
import '../../styles/ui/CartIcon.css';

export const CartIcon = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [itemCount] = useState(3); // Ejemplo: 3 items en carrito

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="cart-icon-button"
        onClick={() => setIsCartOpen(true)}
      >
        🛒
        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
      </Button>

      <CartDropdown isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
