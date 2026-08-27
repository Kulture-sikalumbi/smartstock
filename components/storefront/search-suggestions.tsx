"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface SearchSuggestionsProps {
  products: Product[];
  onSearch?: (query: string) => void;
  onSelectProduct?: (product: Product) => void;
}

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_MS = 300;

export function SearchSuggestions({
  products,
  onSearch,
  onSelectProduct,
}: SearchSuggestionsProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter products based on query
  const filterProducts = useCallback((searchQuery: string): Product[] => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [products]);

  // Debounced search
  const handleInputChange = (value: string) => {
    setQuery(value);
    setHighlightedIndex(-1);

    // Clear previous timer
    if (debounceTimer.current !== undefined) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    // Debounce the search
    debounceTimer.current = setTimeout(() => {
      const filtered = filterProducts(value);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
      setIsLoading(false);
    }, DEBOUNCE_MS);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectProduct(suggestions[highlightedIndex]);
        } else if (query.trim()) {
          handleSubmit(e as React.FormEvent);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  // Select a product from suggestions
  const selectProduct = (product: Product) => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      // Navigate to product search
      router.push(`/?search=${encodeURIComponent(product.name)}`);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);

    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search products..."
          className="pl-9"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
        )}
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto py-1">
            {suggestions.map((product, index) => (
              <button
                key={product.id}
                onClick={() => selectProduct(product)}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(-1)}
                className={cn(
                  "w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3",
                  highlightedIndex === index
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-900 hover:bg-zinc-50"
                )}
              >
                {/* Product image if available */}
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-8 w-8 rounded object-cover shrink-0"
                  />
                )}
                {/* Product details */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium line-clamp-1">{product.name}</p>
                  <p className="text-xs text-zinc-500 line-clamp-1">
                    {product.category}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Show message if query exists but no exact results in suggestions limit */}
          {query && suggestions.length > 0 && suggestions.length < MAX_SUGGESTIONS && (
            <div className="border-t border-zinc-200 px-4 py-2 text-center">
              <button
                onClick={handleSubmit}
                type="button"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                View all results for &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && query && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg p-4">
          <div className="text-center">
            <p className="text-sm text-zinc-600 mb-2">
              No products found for &quot;{query}&quot;
            </p>
            <button
              onClick={handleSubmit}
              type="button"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Search anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
