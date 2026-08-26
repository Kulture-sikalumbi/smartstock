import { supabase, isSupabaseConfigured } from "./supabase/client";
import { MOCK_PRODUCTS } from "./mock-data";
import type { Order, Product } from "./types";

export interface ProductFilters {
  category?: string;
  search?: string;
}

function applyFilters(products: Product[], filters: ProductFilters) {
  let result = products;
  if (filters.category && filters.category !== "All") {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }
  return result;
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return applyFilters(MOCK_PRODUCTS, filters);
  }

  let query = supabase.from("products").select("*").order("created_at", {
    ascending: false,
  });

  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getProducts error:", error.message);
    return applyFilters(MOCK_PRODUCTS, filters);
  }
  return data as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getProductById error:", error.message);
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  }
  return data as Product;
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  return Array.from(new Set(products.map((p) => p.category))).sort();
}

export async function getOrdersWithItems(): Promise<Order[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getOrdersWithItems error:", error.message);
    return [];
  }
  return data as Order[];
}
