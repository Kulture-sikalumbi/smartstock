import { PackageSearch } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/types";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 py-20 text-center text-zinc-500">
        <PackageSearch className="h-10 w-10" />
        <p className="font-medium">No products found</p>
        <p className="text-sm">Try a different search term or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
