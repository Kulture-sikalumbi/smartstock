"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { SearchSuggestions } from "./search-suggestions";
import { AdminLoginModal } from "./admin-login-modal";
import type { Product } from "@/lib/types";

export function SiteHeader() {
  const router = useRouter();
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useCartStore((state) => state.openCart);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [lastLogoTapTime, setLastLogoTapTime] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Load all products for suggestions on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to load products for search:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  function handleSearch(query: string) {
    router.push(`/?search=${encodeURIComponent(query)}`);
  }

  function handleSelectProduct(product: Product) {
    router.push(`/?search=${encodeURIComponent(product.name)}`);
  }

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const now = Date.now();
    const timeDiff = now - lastLogoTapTime;

    // Double-tap threshold: 300ms between taps
    if (timeDiff < 300 && timeDiff > 0) {
      e.preventDefault();
      setAdminModalOpen(true);
      setLastLogoTapTime(0);
    } else {
      setLastLogoTapTime(now);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 font-semibold text-zinc-900 hover:opacity-80 transition-opacity"
            aria-label="SmartStock Home"
          >
            <Store className="h-6 w-6" />
            <span className="hidden sm:inline">Smart Stock</span>
          </Link>

          {!isLoadingProducts && (
            <SearchSuggestions
              products={products}
              onSearch={handleSearch}
              onSelectProduct={handleSelectProduct}
            />
          )}

          <Button
            variant="outline"
            size="icon"
            className="relative shrink-0"
            onClick={openCart}
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-xs font-semibold text-white">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </header>

      <AdminLoginModal open={adminModalOpen} onOpenChange={setAdminModalOpen} />
    </>
  );
}
