"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/lib/types";

const PLACEHOLDER_IMAGE = "/product-placeholder.svg";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [imageFailed, setImageFailed] = useState(false);
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock =
    !isOutOfStock && product.stock_quantity <= product.low_stock_threshold;
  const showPlaceholder = !product.image_url || imageFailed;

  return (
    <Card className="group flex flex-col overflow-hidden transition-[box-shadow,transform] hover:shadow-md active:scale-[0.98] active:shadow-sm">
      <Link
        href={`/product/${product.id}`}
        prefetch={true}
        className="relative block aspect-square bg-zinc-100"
      >
        {showPlaceholder ? (
          <Image
            src={PLACEHOLDER_IMAGE}
            alt={`${product.name} (image unavailable)`}
            fill
            className="object-contain p-10"
          />
        ) : (
          <Image
            src={product.image_url as string}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImageFailed(true)}
          />
        )}
        {isOutOfStock && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        )}
        {isLowStock && (
          <Badge variant="warning" className="absolute left-2 top-2">
            Low stock
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {product.category}
        </span>
        <Link
          href={`/product/${product.id}`}
          prefetch={true}
          className="line-clamp-2 font-medium text-zinc-900 hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-semibold text-zinc-900">
            {formatCurrency(product.price)}
          </span>
          <Button
            size="icon"
            variant="secondary"
            className="active:scale-90 transition-transform"
            disabled={isOutOfStock || isLowStock}
            onClick={() => {
              if (isOutOfStock || isLowStock) {
                toast.error("This product is out of stock and cannot be added to cart.");
                return;
              }
              addItem(product);
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
