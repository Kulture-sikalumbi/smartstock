"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { sendLowStockAlert } from "@/app/actions/notifications";
import type { CartItem, PaymentMethod } from "@/lib/types";

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Simulates a completed mobile-money / card payment and persists the
 * order to Supabase. The order is first written as PENDING together
 * with its line items, then flipped to COMPLETED — which is what the
 * `decrement_stock_on_completed_order` trigger listens for to reduce
 * `stock_quantity` on each purchased product (see sql/schema.sql).
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const { customerName, customerPhone, paymentMethod, items } = input;

  if (!items.length) {
    return { success: false, error: "Your cart is empty." };
  }
  if (!customerName.trim() || !customerPhone.trim()) {
    return { success: false, error: "Name and phone number are required." };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      error:
        "Supabase isn't configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local (see sql/schema.sql).",
    };
  }

  const supabase = getServerSupabase();
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Re-check stock server-side to avoid overselling with stale client state.
  const productIds = items.map((item) => item.productId);
  const { data: currentProducts, error: stockCheckError } = await supabase
    .from("products")
    .select("id, name, stock_quantity")
    .in("id", productIds);

  if (stockCheckError) {
    return { success: false, error: stockCheckError.message };
  }

  for (const item of items) {
    const product = currentProducts?.find((p) => p.id === item.productId);
    if (!product || product.stock_quantity < item.quantity) {
      return {
        success: false,
        error: `${item.name} no longer has enough stock available.`,
      };
    }
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      payment_method: paymentMethod,
      status: "PENDING",
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message ?? "Failed to create order." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
    }))
  );

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  // Flip to COMPLETED — the DB trigger decrements stock_quantity for us.
  const { error: completeError } = await supabase
    .from("orders")
    .update({ status: "COMPLETED" })
    .eq("id", order.id);

  if (completeError) {
    return { success: false, error: completeError.message };
  }

  // The DB trigger has now decremented stock — re-fetch the purchased
  // products and fire a low-stock alert email for any that dropped
  // below their threshold. Failures here must never fail the order.
  const { data: updatedProducts } = await supabase
    .from("products")
    .select("name, stock_quantity, low_stock_threshold")
    .in("id", productIds);

  for (const product of updatedProducts ?? []) {
    if (product.stock_quantity < product.low_stock_threshold) {
      void sendLowStockAlert({
        productName: product.name,
        currentStock: product.stock_quantity,
        threshold: product.low_stock_threshold,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return { success: true, orderId: order.id as string };
}
