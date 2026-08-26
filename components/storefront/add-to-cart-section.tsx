"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/lib/types";

export function AddToCartSection({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock =
    !isOutOfStock && product.stock_quantity <= product.low_stock_threshold;

  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex items-center rounded-md border border-zinc-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={isOutOfStock || isLowStock}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setQuantity((q) => Math.min(product.stock_quantity, q + 1))
          }
          disabled={isOutOfStock || isLowStock}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        className="flex-1"
        disabled={isOutOfStock || isLowStock}
        onClick={() => {
          if (isOutOfStock || isLowStock) {
            toast.error("This product is out of stock and cannot be added to cart.");
            return;
          }
          addItem(product, quantity);
          setQuantity(1);
        }}
      >
        {isOutOfStock || isLowStock ? "Out of stock" : "Add to cart"}
      </Button>
    </div>
  );
}
