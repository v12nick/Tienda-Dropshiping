import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import {
  createOrder,
  generateOrderId,
  getOrder,
  type Order,
  type OrderItem,
} from "@/lib/orders";

const SHIPPING_FLAT = 4.99;
const FREE_SHIPPING_THRESHOLD = 75;

type IncomingItem = { id: string; quantity: number };

export async function POST(request: Request) {
  let body: {
    customer?: { name?: string; email?: string; address?: string };
    items?: IncomingItem[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer, items } = body;

  if (!customer?.name || !customer?.email || !customer?.address) {
    return NextResponse.json(
      { error: "Name, email, and shipping address are required." },
      { status: 400 },
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const orderItems: OrderItem[] = [];
  for (const item of items) {
    const product = getProduct(item.id);
    const quantity = Number(item.quantity);
    if (!product || !Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: `Invalid item in cart: ${item.id}` },
        { status: 400 },
      );
    }
    orderItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: Math.floor(quantity),
    });
  }

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  const order: Order = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    customer: {
      name: customer.name,
      email: customer.email,
      address: customer.address,
    },
    items: orderItems,
    subtotal,
    shipping,
    total,
  };

  createOrder(order);

  return NextResponse.json({ order }, { status: 201 });
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
