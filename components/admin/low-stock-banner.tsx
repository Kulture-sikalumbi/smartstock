"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function LowStockBanner({ products }: { products: Product[] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 font-medium text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          {products.length} product{products.length > 1 ? "s" : ""} running low
          on stock
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-amber-700 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="flex flex-wrap gap-2 text-sm text-amber-800">
          {products.map((product) => (
            <span
              key={product.id}
              className="rounded-full bg-amber-100 px-3 py-1"
            >
              {product.name} — {product.stock_quantity} left
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
