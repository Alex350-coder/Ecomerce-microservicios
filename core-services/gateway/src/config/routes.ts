export interface ServiceRoute {
  prefix: string;
  envKey: string;
}

export const SERVICE_ROUTES: ServiceRoute[] = [
  { prefix: 'auth', envKey: 'AUTH_SERVICE_URL' },
  { prefix: 'users', envKey: 'USER_SERVICE_URL' },
  { prefix: 'products', envKey: 'PRODUCT_SERVICE_URL' },
  { prefix: 'cart', envKey: 'CART_SERVICE_URL' },
  { prefix: 'orders', envKey: 'ORDER_SERVICE_URL' },
  { prefix: 'inventory', envKey: 'INVENTORY_SERVICE_URL' },
  { prefix: 'payments', envKey: 'PAYMENT_SERVICE_URL' },
];
