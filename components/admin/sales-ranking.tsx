"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DateRangeSelector, type DateRangeOption } from "./date-range-selector";
import type { ProductSales } from "@/lib/admin-data";
import type { DateRange } from "./date-range-selector";

function RankingList({ items }: { items: ProductSales[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No sales data yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={item.productId} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
            {index + 1}
          </span>
          <div className="flex flex-1 items-center justify-between gap-2">
            <span className="text-sm font-medium text-zinc-900 line-clamp-1">
              {item.name}
            </span>
            <span className="whitespace-nowrap text-sm text-zinc-500">
              {item.unitsSold} sold · {formatCurrency(item.revenue)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SalesRanking({
  topSelling,
  leastSelling,
}: {
  topSelling: ProductSales[];
  leastSelling: ProductSales[];
}) {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("alltime");

  const handleRangeChange = (range: DateRangeOption, _dates: DateRange) => {
    setSelectedRange(range);
    // Note: In a real application, you would refetch data here with the new date range
    // For now, this component displays static data from the server-side initial load
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-zinc-600">Filter by date range:</p>
        <DateRangeSelector selectedRange={selectedRange} onRangeChange={handleRangeChange} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Top-selling products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList items={topSelling} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Stagnant inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList items={leastSelling} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
