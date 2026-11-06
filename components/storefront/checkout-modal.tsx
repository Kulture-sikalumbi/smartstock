"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { checkOrderPayment, createOrder } from "@/app/actions/orders";
import { OrderConfirmationReceipt } from "./order-confirmation-receipt";
import type { PaymentMethod } from "@/lib/types";

type Step = "form" | "processing" | "waiting" | "success" | "error";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MOBILE_MONEY");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [pendingMessage, setPendingMessage] = useState("");

  useEffect(() => {
    if (step !== "waiting" || !orderId) return;

    let stopped = false;
    let timer: number | undefined;
    const checkStatus = async () => {
      try {
        const result = await checkOrderPayment(orderId);
        if (stopped) return;

        if (result.status === "COMPLETED") {
          setConfirmedTotal(result.totalAmount ?? totalPrice);
          setStep("success");
          clearCart();
          router.refresh();
          return;
        } else if (result.status === "FAILED") {
          setErrorMessage("Lipila reports that this payment failed. You can try again.");
          setStep("error");
          return;
        }
      } catch {
        // Keep waiting and retry the provider status check.
      }
      if (!stopped) timer = window.setTimeout(() => void checkStatus(), 5000);
    };

    void checkStatus();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [step, orderId, totalPrice, clearCart, router]);

  function resetAndClose() {
    setStep("form");
    setName("");
    setPhone("");
    setPaymentMethod("MOBILE_MONEY");
    setErrorMessage("");
    setOrderId(null);
    setConfirmedTotal(0);
    setPendingMessage("");
    onOpenChange(false);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setStep("processing");

    let result;
    try {
      result = await createOrder({
        customerName: name,
        customerPhone: phone,
        paymentMethod,
        items,
      });
    } catch {
      setErrorMessage("Could not start payment. Please try again.");
      setStep("error");
      return;
    }

    if (result.success) {
      setConfirmedTotal(totalPrice);
      setOrderId(result.orderId ?? null);
      setPendingMessage(result.error ?? "");
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }
      setStep("waiting");
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
                placeholder="097 123 4567"
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
                      {method.networks && (
                        <span className="mt-2 flex flex-wrap gap-2">
                          {method.networks.map((network) => (
                            <span
                              key={network.label}
                              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600"
                            >
                              <img src={network.icon} alt="" className="h-4 w-4 object-contain" />
                              {network.label}
                            </span>
                          ))}
                        </span>
                      )}
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
                Starting your Lipila payment...
              </p>
              <p className="text-sm text-zinc-500">
                Keep this page open while the request is sent.
              </p>
            </div>
          </div>
        )}

        {step === "waiting" && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
            <div>
              <DialogTitle>Approve the payment on your phone</DialogTitle>
              <p className="mt-2 text-sm text-zinc-500">
                      We sent a Lipila request to {phone}. Lipila detects the network from your number. Enter your Mobile Money PIN to approve it.
              </p>
              {pendingMessage && <p className="mt-2 text-sm text-amber-700">{pendingMessage}</p>}
              <p className="mt-2 text-xs text-zinc-500">Waiting for Lipila to confirm payment…</p>
            </div>
            {orderId && (
              <Button asChild variant="outline">
                <Link href={`/payment/return/${orderId}`}>View payment status</Link>
              </Button>
            )}
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
