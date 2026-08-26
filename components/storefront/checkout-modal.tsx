"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useCartStore } from "@/store/cart-store";
import { createOrder } from "@/app/actions/orders";
import { OrderConfirmationReceipt } from "./order-confirmation-receipt";
import type { PaymentMethod } from "@/lib/types";

type Step = "form" | "processing" | "success" | "error";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const totalPrice = useCartStore((state) => state.totalPrice());
  const clearCart = useCartStore((state) => state.clearCart);

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MTN_MOMO");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  function resetAndClose() {
    setStep("form");
    setName("");
    setPhone("");
    setPaymentMethod("MTN_MOMO");
    setErrorMessage("");
    setOrderId(null);
    setConfirmedTotal(0);
    onOpenChange(false);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setStep("processing");

    // Simulate the USSD / bank authorization prompt.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const result = await createOrder({
      customerName: name,
      customerPhone: phone,
      paymentMethod,
      items,
    });

    if (result.success) {
      // Store the total before clearing cart so it displays correctly in receipt
      setConfirmedTotal(totalPrice);
      setOrderId(result.orderId ?? null);
      setStep("success");
      clearCart();
      router.refresh();
    } else {
      setErrorMessage(result.error ?? "Payment failed. Please try again.");
      setStep("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else onOpenChange(next);
      }}
    >
      <DialogContent>
        {step === "form" && (
          <form onSubmit={handlePay} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>
                Total due: <strong>{formatCurrency(totalPrice)}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ama Owusu"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="024 123 4567"
              />
            </div>

            <div className="grid gap-2">
              <Label>Payment method</Label>
              <div className="grid gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    type="button"
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      paymentMethod === method.value
                        ? "border-zinc-900 ring-1 ring-zinc-900"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <img
                      src={method.icon}
                      alt={method.label}
                      className="h-10 w-10 object-contain"
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-900">
                        {method.label}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {method.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">
                Pay {formatCurrency(totalPrice)}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
            <div>
              <p className="font-medium text-zinc-900">
                {paymentMethod === "BANK_CARD"
                  ? "Authorizing your card payment..."
                  : "Check your phone to approve the prompt..."}
              </p>
              <p className="text-sm text-zinc-500">
                {paymentMethod === "BANK_CARD"
                  ? "Confirming with your bank"
                  : "Enter your Mobile Money PIN to confirm"}
              </p>
            </div>
          </div>
        )}

        {step === "success" && orderId && (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>✓ Order Confirmed!</DialogTitle>
            </DialogHeader>
            <OrderConfirmationReceipt
              orderId={orderId}
              items={items}
              totalPrice={confirmedTotal}
              paymentMethod={paymentMethod}
              customerName={name}
              customerPhone={phone}
              onClose={resetAndClose}
            />
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <XCircle className="h-12 w-12 text-red-600" />
            <div>
              <DialogTitle>Payment failed</DialogTitle>
              <p className="mt-1 text-sm text-zinc-500">{errorMessage}</p>
            </div>
            <Button onClick={() => setStep("form")} className="w-full">
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
