"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { CartItem, PaymentMethod } from "@/lib/types";

interface OrderConfirmationReceiptProps {
  orderId: string;
  items: CartItem[];
  totalPrice: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  onClose: () => void;
}

export function OrderConfirmationReceipt({
  orderId,
  items,
  totalPrice,
  paymentMethod,
  customerName,
  customerPhone,
  onClose,
}: OrderConfirmationReceiptProps) {
  const paymentMethodData = PAYMENT_METHODS.find(
    (m) => m.value === paymentMethod
  );

  function handlePrintPdf() {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const receiptHtml = generateReceiptHtml();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
  }

  function generateReceiptHtml(): string {
    const date = new Date().toLocaleString("en-ZM", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const itemsHtml = items
      .map(
        (item) =>
          `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${item.name}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">K${(item.price * item.quantity).toFixed(2)}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Order Receipt #${orderId.slice(0, 8)}</title><style>body { font-family: Arial, sans-serif; margin: 20px; color: #1f2937; } .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; background: white; } h1 { text-align: center; font-size: 20px; margin: 0 0 20px 0; } .order-details { background: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; } .order-details p { margin: 8px 0; } .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; } .items-table th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #1f2937; font-weight: bold; } .items-table tr:last-child td { border-bottom: none; } .total-section { border-top: 2px solid #1f2937; padding-top: 16px; margin-top: 16px; } .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; font-size: 16px; } .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; } @media print { body { margin: 0; } .receipt-container { border: none; } }</style></head><body><div class="receipt-container"><h1>Order Receipt</h1><div class="order-details"><p><strong>Order ID:</strong> #${orderId.slice(0, 8)}</p><p><strong>Date:</strong> ${date}</p><p><strong>Customer:</strong> ${customerName}</p><p><strong>Phone:</strong> ${customerPhone}</p><p><strong>Payment Method:</strong> ${paymentMethodData?.label || paymentMethod}</p></div><table class="items-table"><thead><tr><th>Product</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Subtotal</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="total-section"><div class="total-row"><span>Total Amount Paid:</span><span>K${totalPrice.toFixed(2)}</span></div></div><div class="footer"><p>Thank you for your purchase!</p><p>SmartStock © ${new Date().getFullYear()}</p></div></div></body></html>`;

    return html;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Receipt Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        {/* Header */}
        <div className="border-b border-zinc-100 pb-4 mb-4">
          <p className="text-sm text-zinc-500 mb-1">Order ID</p>
          <p className="font-mono text-lg font-semibold text-zinc-900">
            #{orderId.slice(0, 8)}
          </p>
        </div>

        {/* Customer & Payment Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-zinc-500 mb-1">Customer Name</p>
            <p className="font-medium text-zinc-900">{customerName}</p>
          </div>
          <div>
            <p className="text-zinc-500 mb-1">Phone</p>
            <p className="font-medium text-zinc-900">{customerPhone}</p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="mb-6">
          <p className="mb-3 font-semibold text-zinc-900">Order Summary</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 font-medium text-zinc-900">
                    {item.name}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <p className="ml-2 whitespace-nowrap font-semibold text-zinc-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-200 mb-4" />

        {/* Total & Payment Method */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-zinc-900">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPrice)}
            </p>
          </div>
          {paymentMethodData && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Payment Method</p>
              <Badge variant="secondary" className="gap-2">
                <img
                  src={paymentMethodData.icon}
                  alt={paymentMethodData.label}
                  className="h-4 w-4 object-contain"
                />
                {paymentMethodData.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-200 mb-4" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handlePrintPdf}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Print / Save PDF</span>
            <span className="sm:hidden">Save PDF</span>
          </Button>
          <Button onClick={onClose} className="flex-1">
            Continue Shopping
          </Button>
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
        <p className="text-sm text-emerald-900">
          ✓ Thank you for your order! You&apos;ll receive an SMS confirmation shortly.
        </p>
      </div>
    </div>
  );
}
