const SHIPPING_RATES: Record<string, number> = {
  standard: 5.99,
  express: 12.99,
  priority: 24.99,
};

const TAX_RATE = 0.08;

export interface OrderItemInput {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export function calculateOrderTotals(
  items: OrderItemInput[],
  shippingMethod: string = 'standard',
): { subtotal: number; shipping: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = SHIPPING_RATES[shippingMethod] ?? SHIPPING_RATES.standard;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    shipping,
    tax,
    total,
  };
}
