"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LogOut, ShoppingCart, Store, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { SearchSuggestions } from "./search-suggestions";
import { AdminLoginModal } from "./admin-login-modal";
import type { Product } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { getDemoCustomer, signOutDemoAccount, subscribeToDemoAuth } from "@/lib/demo-auth";

export function SiteHeader() {
  const router = useRouter();
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useCartStore((state) => state.openCart);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSearchPending, startSearchTransition] = useTransition();

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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const updateDemoCustomer = () => setCustomerEmail(getDemoCustomer()?.email ?? null);
      updateDemoCustomer();
      return subscribeToDemoAuth(updateDemoCustomer);
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setCustomerEmail(data.session?.user.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCustomerEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (!isSupabaseConfigured) {
      signOutDemoAccount();
      return;
    }
    await supabase.auth.signOut();
    router.refresh();
  }

  function handleSearch(query: string) {
    startSearchTransition(() => {
      router.push(`/?search=${encodeURIComponent(query)}`, { scroll: false });
    });
  }

  function handleSelectProduct(product: Product) {
    startSearchTransition(() => {
      router.push(`/?search=${encodeURIComponent(product.name)}`, { scroll: false });
    });
  }

  // Admin access gesture: long-press on touch devices, double-click on
  // desktop. Double-tap-to-detect via manual timestamps was unreliable on
  // mobile (touch "click" events are delayed/coalesced by the browser, and
  // rapid taps can be intercepted as a zoom gesture), so touch input uses a
  // deliberate press-and-hold instead. Desktop keeps a click gesture, using
  // `MouseEvent.detail` for a native, browser-timed double-click count.
  const LONG_PRESS_MS = 550;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  function clearLongPressTimer() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleLogoPointerDown(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== "touch") return;
    longPressTriggered.current = false;
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setAdminModalOpen(true);
    }, LONG_PRESS_MS);
  }

  function handleLogoPointerUp(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== "touch") return;
    clearLongPressTimer();
  }

  function handleLogoPointerCancel(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== "touch") return;
    clearLongPressTimer();
  }

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // A long-press already opened the admin modal for this interaction --
    // swallow the trailing click so it doesn't also navigate home.
    if (longPressTriggered.current) {
      e.preventDefault();
      longPressTriggered.current = false;
      return;
    }
    // Desktop double-click (native click count, not a touch tap).
    if (e.detail >= 2) {
      e.preventDefault();
      setAdminModalOpen(true);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            onClick={handleLogoClick}
            onPointerDown={handleLogoPointerDown}
            onPointerUp={handleLogoPointerUp}
            onPointerCancel={handleLogoPointerCancel}
            onPointerLeave={handleLogoPointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            className="flex select-none items-center gap-2 font-semibold text-zinc-900 [-webkit-touch-callout:none] hover:opacity-80 transition-opacity active:opacity-60"
            aria-label="SmartStock Home (double-click or long-press for admin)"
          >
            <Store className="h-6 w-6" />
            <span className="hidden sm:inline">Smart Stock</span>
          </Link>

          {!isLoadingProducts && (
            <SearchSuggestions
              products={products}
              onSearch={handleSearch}
              onSelectProduct={handleSelectProduct}
              isNavigating={isSearchPending}
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

          {customerEmail ? (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/account"
                className="hidden max-w-36 truncate text-sm text-zinc-600 sm:block"
              >
                {customerEmail}
              </Link>
              <Button variant="outline" size="icon" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" className="shrink-0 gap-2 px-3">
              <Link href="/account">
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            </Button>
          )}
        </div>
      </header>

      <AdminLoginModal open={adminModalOpen} onOpenChange={setAdminModalOpen} />
    </>
  );
}
