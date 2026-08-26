export type OrderStatus = "PENDING" | "COMPLETED" | "FAILED";

export type PaymentMethod = "MTN_MOMO" | "AIRTEL_MONEY" | "BANK_CARD";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock_quantity: number;
}
