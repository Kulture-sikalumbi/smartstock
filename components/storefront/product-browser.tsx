"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryFilter } from "./category-filter";
import { ProductGrid } from "./product-grid";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductBrowserProps {
  products: Product[];
  categories: string[];
}

export function ProductBrowser({ products, categories }: ProductBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") ?? "All";

  // Local state updates instantly on click; the router push happens inside
  // a transition so the pill highlight never waits on the network.
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveCategory(urlCategory);
  }, [urlCategory]);

  function selectCategory(category: string) {
    if (category === activeCategory) return;
    setActiveCategory(category);

    const params = new URLSearchParams(searchParams.toString());
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <>
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        isPending={isPending}
        onSelect={selectCategory}
      />

      <div
        className={cn(
          "transition-opacity duration-150",
          isPending && "pointer-events-none opacity-50"
        )}
      >
        <ProductGrid products={products} />
      </div>
    </>
  );
}
