export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

// In-memory order store. Sufficient for local development and demos.
// It is attached to `globalThis` so the data survives module re-evaluation
// during Next.js dev hot-reloading / on-demand route compilation. Without
// this, the map would reset between the create (POST) and fetch (GET)
// requests once an unrelated route triggers a recompile.
const globalForOrders = globalThis as unknown as {
  __tiendaOrders?: Map<string, Order>;
};

const orders: Map<string, Order> =
  globalForOrders.__tiendaOrders ?? new Map<string, Order>();

globalForOrders.__tiendaOrders = orders;

export function createOrder(order: Order): void {
  orders.set(order.id, order);
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

export function generateOrderId(): string {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TD-${Date.now().toString().slice(-6)}-${random}`;
}
