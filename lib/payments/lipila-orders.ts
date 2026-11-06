import { revalidatePath } from "next/cache";
import {
  notifyLowStockTransition,
  sendNewOrderAlert,
} from "@/app/actions/notifications";
import { getLipilaPaymentStatus } from "@/lib/lipila";
import { getServerSupabase, isSupabaseAdminConfigured } from "@/lib/supabase/server";
import type { CartItem, OrderStatus, PaymentMethod } from "@/lib/types";

export type PublicPaymentStatus = OrderStatus | "UNKNOWN";

function toPaymentItems(items: Array<{
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  stock_before: number | null;
}>): CartItem[] {
  return items.map((item) => ({
    productId: item.product_id,
    name: item.product_name,
    price: Number(item.unit_price),
    image_url: null,
    quantity: item.quantity,
    stock_quantity: 0,
  }));
}

/** Check Lipila's server-side status and apply a terminal state only once. */
export async function refreshLipilaOrder(orderId: string): Promise<{
  status: PublicPaymentStatus;
  totalAmount?: number;
}> {
  if (!isSupabaseAdminConfigured) return { status: "UNKNOWN" };

  const supabase = getServerSupabase();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total_amount, payment_method, customer_name, customer_phone")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) return { status: "UNKNOWN" };
  if (order.status !== "PENDING") {
    return { status: order.status as OrderStatus, totalAmount: Number(order.total_amount) };
  }

  let transaction;
  try {
    transaction = await getLipilaPaymentStatus(orderId);
  } catch (error) {
    console.error("Lipila status lookup failed:", error instanceof Error ? error.message : error);
    return { status: "PENDING", totalAmount: Number(order.total_amount) };
  }

  const matchesOrder =
    transaction.referenceId === orderId &&
    transaction.currency === "ZMW" &&
    Number(transaction.amount) === Number(order.total_amount) &&
    (!transaction.type || transaction.type.toLowerCase() === "collection");

  if (!matchesOrder) {
    console.error(`Lipila transaction details did not match order ${orderId}.`);
    return { status: "PENDING", totalAmount: Number(order.total_amount) };
  }

  const normalizedStatus = transaction.status.toLowerCase();
  const nextStatus: OrderStatus | null =
    normalizedStatus === "successful" || normalizedStatus === "completed"
      ? "COMPLETED"
      : normalizedStatus === "failed"
        ? "FAILED"
        : null;

  if (!nextStatus) {
    return { status: "PENDING", totalAmount: Number(order.total_amount) };
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Could not update Lipila order status:", updateError.message);
    return { status: "PENDING", totalAmount: Number(order.total_amount) };
  }

  if (updatedOrder && nextStatus === "COMPLETED") {
    const { data: rows } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, unit_price, stock_before")
      .eq("order_id", orderId);
    const items = toPaymentItems(rows ?? []);

    await sendNewOrderAlert({
      orderId,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      paymentMethod: order.payment_method as PaymentMethod,
      totalAmount: Number(order.total_amount),
      items,
    });

    const productIds = [...new Set(items.map((item) => item.productId))];
    if (productIds.length) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, stock_quantity, low_stock_threshold")
        .in("id", productIds);

      for (const product of products ?? []) {
        const purchasedItem = rows?.find((item) => item.product_id === product.id);
        await notifyLowStockTransition({
          productName: product.name,
          previousStock: purchasedItem?.stock_before ?? null,
          previousThreshold: purchasedItem ? product.low_stock_threshold : null,
          currentStock: product.stock_quantity,
          currentThreshold: product.low_stock_threshold,
        });
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { status: nextStatus, totalAmount: Number(order.total_amount) };
}

export async function getOrderPaymentStatus(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { status: "UNKNOWN" as const };
  return refreshLipilaOrder(orderId);
}
