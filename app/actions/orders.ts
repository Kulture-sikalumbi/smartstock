"use server";

import type { CartItem, PaymentMethod } from "@/lib/types";
import { LipilaApiError, normalizeZambianPhone, startLipilaPayment } from "@/lib/lipila";
import { getServerSupabase, isSupabaseAdminConfigured } from "@/lib/supabase/server";
import { getOrderPaymentStatus } from "@/lib/payments/lipila-orders";

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  redirectUrl?: string;
  error?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid checkout request." };
  }

  const customerName = typeof input.customerName === "string" ? input.customerName.trim() : "";
  const customerPhone = typeof input.customerPhone === "string"
    ? normalizeZambianPhone(input.customerPhone)
    : null;
  if (!customerName || customerName.length > 120 || !customerPhone) {
    return { success: false, error: "Enter your name and a valid Zambian phone number." };
  }
  if (input.paymentMethod !== "MOBILE_MONEY") {
    return { success: false, error: "Choose a supported payment method." };
  }
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) {
    return { success: false, error: "Your cart is empty or contains too many items." };
  }
  if (!process.env.LIPILA_API_KEY) {
    return { success: false, error: "Mobile Money payments are temporarily unavailable. Please try again later." };
  }
  if (process.env.LIPILA_ENV === "production") {
    try {
      const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
      if (siteUrl.protocol !== "https:" || !process.env.LIPILA_WEBHOOK_SECRET) {
        return {
          success: false,
          error: "Payments are temporarily unavailable. Please try again later.",
        };
      }
    } catch {
      return { success: false, error: "Payments are temporarily unavailable. Please try again later." };
    }
  }
  if (!isSupabaseAdminConfigured) {
    return { success: false, error: "Supabase server access is not configured." };
  }

  const quantities = new Map<string, number>();
  for (const item of input.items) {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100
    ) {
      return { success: false, error: "The cart contains an invalid item." };
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const supabase = getServerSupabase();
  const { data: checkoutReady, error: readinessError } = await supabase.rpc(
    "lipila_checkout_ready"
  );
  if (readinessError || checkoutReady !== true) {
    return {
      success: false,
      error: "Payment setup is not complete. Please contact the store before retrying.",
    };
  }

  const productIds = [...quantities.keys()];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, stock_quantity")
    .in("id", productIds);

  if (productsError) {
    return { success: false, error: "Could not validate the cart. Please try again." };
  }

  for (const [productId, quantity] of quantities) {
    const product = products?.find((candidate) => candidate.id === productId);
    if (!product || product.stock_quantity < quantity) {
      return {
        success: false,
        error: `${product?.name ?? "A product"} no longer has enough stock available.`,
      };
    }
  }

  const orderItems = [...quantities.entries()].map(([productId, quantity]) => {
    const product = products!.find((candidate) => candidate.id === productId)!;
    return {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
    };
  });
  const totalAmount = Number(
    orderItems.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0).toFixed(2)
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      payment_method: input.paymentMethod,
      status: "PENDING",
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: "Could not create the order. Please try again." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({ ...item, order_id: order.id }))
  );

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return {
      success: false,
      error: itemsError.message.includes("stock")
        ? "Stock changed while you were checking out. Please review your cart."
        : "Could not save the order items. Please try again.",
    };
  }

  try {
    const payment = await startLipilaPayment({
      orderId: order.id,
      amount: totalAmount,
      paymentMethod: input.paymentMethod,
      customerPhone,
    });

    if (payment.status === "Failed") {
      await supabase.from("orders").update({ status: "FAILED" }).eq("id", order.id);
      return { success: false, error: "We could not start your payment. Please check your phone number and try again." };
    }

    return { success: true, orderId: order.id, redirectUrl: payment.redirectUrl };
  } catch (error) {
    console.error("Lipila payment initiation failed:", error instanceof Error ? error.message : error);
    if (error instanceof LipilaApiError && error.statusCode < 500) {
      await supabase.from("orders").update({ status: "FAILED" }).eq("id", order.id);
      return {
        success: false,
        error: "We could not start your payment. Please check your phone number and try again.",
      };
    }
    return {
      success: true,
      orderId: order.id,
      error: "We could not confirm the payment request. Check your phone before retrying.",
    };
  }
}

export async function checkOrderPayment(orderId: string) {
  return getOrderPaymentStatus(orderId);
}
