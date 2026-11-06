"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkOrderPayment } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { OrderStatus } from "@/lib/types";

export function PaymentReturnStatus({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<OrderStatus | "UNKNOWN">("PENDING");
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const checkStatus = async () => {
      try {
        const result = await checkOrderPayment(orderId);
        if (stopped) return;
        setStatus(result.status);
        if (result.status === "COMPLETED") clearCart();
        if (result.status === "COMPLETED" || result.status === "FAILED" || result.status === "UNKNOWN") return;
      } catch {
        if (!stopped) setStatus("PENDING");
      }
      if (!stopped) timer = window.setTimeout(() => void checkStatus(), 5000);
    };

    void checkStatus();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [orderId, clearCart]);

  const message =
    status === "COMPLETED"
      ? "Payment confirmed. Your order is complete."
      : status === "FAILED"
        ? "Lipila could not complete the payment. No order was confirmed."
        : status === "UNKNOWN"
          ? "We could not find this order. Contact the store before trying again."
          : "We are waiting for Lipila to confirm your payment. This can take a moment.";

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">
        {status === "COMPLETED" ? "Order confirmed" : "Checking your payment"}
      </h1>
      <p className="text-sm text-zinc-600">{message}</p>
      <p className="text-xs text-zinc-500">Order reference: {orderId}</p>
      {status !== "COMPLETED" && status !== "FAILED" && (
        <p className="text-xs text-zinc-500">Keep this page open while we check the transaction.</p>
      )}
      <Button asChild>
        <Link href="/">Return to the store</Link>
      </Button>
    </main>
  );
}
