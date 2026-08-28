"use client";

import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  isPending?: boolean;
  onSelect: (category: string) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  isPending,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto whitespace-nowrap py-2">
      {["All", ...categories].map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95",
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
            )}
          >
            {category}
            {isPending && isActive && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white/80 align-middle" />
            )}
          </button>
        );
      })}
    </div>
  );
}
