import { getServerSupabase, isSupabaseConfigured } from "./supabase/server";
import { MOCK_PRODUCTS } from "./mock-data";
import type { Order, Product } from "./types";

export interface RevenueStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface ProductSales {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  stockQuantity: number;
}

export async function getRevenueStats(): Promise<RevenueStats> {
  if (!isSupabaseConfigured) {
    return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("status", "COMPLETED");

  if (error || !data) {
    console.error("getRevenueStats error:", error?.message);
    return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
  }

  const totalRevenue = data.reduce(
    (sum, order) => sum + Number(order.total_amount),
    0
  );
  const totalOrders = data.length;

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
  };
}

export async function getProductSalesRanking(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  topSelling: ProductSales[];
  leastSelling: ProductSales[];
}> {
  if (!isSupabaseConfigured) {
    return { topSelling: [], leastSelling: [] };
  }

  const supabase = getServerSupabase();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, stock_quantity");

  if (productsError || !products) {
    console.error("getProductSalesRanking products error:", productsError?.message);
    return { topSelling: [], leastSelling: [] };
  }

  let query = supabase
    .from("order_items")
    .select("product_id, quantity, unit_price, orders!inner(status, created_at)")
    .eq("orders.status", "COMPLETED");

  // Apply date filters if provided
  if (options?.startDate) {
    query = query.gte("orders.created_at", options.startDate.toISOString());
  }
  if (options?.endDate) {
    query = query.lte("orders.created_at", options.endDate.toISOString());
  }

  const { data: orderItems, error: itemsError } = await query;

  if (itemsError) {
    console.error("getProductSalesRanking order_items error:", itemsError.message);
  }

  const salesByProduct = new Map<string, { unitsSold: number; revenue: number }>();
  for (const item of orderItems ?? []) {
    const existing = salesByProduct.get(item.product_id) ?? {
      unitsSold: 0,
      revenue: 0,
    };
    existing.unitsSold += item.quantity;
    existing.revenue += item.quantity * Number(item.unit_price);
    salesByProduct.set(item.product_id, existing);
  }

  const ranking: ProductSales[] = products.map((product) => {
    const sales = salesByProduct.get(product.id) ?? { unitsSold: 0, revenue: 0 };
    return {
      productId: product.id,
      name: product.name,
      unitsSold: sales.unitsSold,
      revenue: sales.revenue,
      stockQuantity: product.stock_quantity,
    };
  });

  const sold = ranking.filter((p) => p.unitsSold > 0);
  const topSelling = [...sold]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);
  const leastSelling = [...ranking]
    .sort((a, b) => a.unitsSold - b.unitsSold)
    .slice(0, 5);

  return { topSelling, leastSelling };
}

export async function getLowStockProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return MOCK_PRODUCTS.filter(
      (p) => p.stock_quantity <= p.low_stock_threshold
    );
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("products").select("*");

  if (error || !data) {
    console.error("getLowStockProducts error:", error?.message);
    return [];
  }

  return (data as Product[]).filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  );
}

export async function getAllProductsForAdmin(): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return MOCK_PRODUCTS;
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("getAllProductsForAdmin error:", error?.message);
    return MOCK_PRODUCTS;
  }

  return data as Product[];
}

export async function getCompletedOrdersForAdmin(): Promise<Order[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("status", "COMPLETED")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getCompletedOrdersForAdmin error:", error?.message);
    return [];
  }

  return data as Order[];
}
