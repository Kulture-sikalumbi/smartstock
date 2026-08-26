"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Search,
  X,
  Download,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { deleteProduct, updateStockQuantity } from "@/app/admin/actions";
import { ProductFormDialog } from "./product-form-dialog";
import type { Product } from "@/lib/types";

const ITEMS_PER_PAGE = 8;

export function InventoryTable({ products }: { products: Product[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingStock, setPendingStock] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );

  // Clamp the page during render instead of syncing via an effect, so it
  // stays in range whenever the filtered list shrinks.
  const currentPageInRange = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPageInRange - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPageInRange]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function openCreateDialog() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  async function handleStockSave(product: Product) {
    const newValue = pendingStock[product.id];
    if (newValue === undefined || newValue === product.stock_quantity) return;

    const result = await updateStockQuantity(product.id, newValue);
    if (result.success) {
      clearPendingStock(product.id);
      toast.success(`Updated stock for ${product.name}`);
    } else {
      toast.error(result.error ?? "Failed to update stock");
    }
  }

  function clearPendingStock(productId: string) {
    setPendingStock((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }

  async function handleQuickAdjust(product: Product, delta: number) {
    const base = pendingStock[product.id] ?? product.stock_quantity;
    const newValue = Math.max(0, base + delta);
    if (newValue === product.stock_quantity) {
      clearPendingStock(product.id);
      return;
    }

    const result = await updateStockQuantity(product.id, newValue);
    if (result.success) {
      clearPendingStock(product.id);
      toast.success(
        `Stock ${delta > 0 ? "increased" : "decreased"} for ${product.name}`
      );
    } else {
      toast.error(result.error ?? "Failed to update stock");
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    const result = await deleteProduct(product.id);
    if (result.success) {
      toast.success("Product deleted");
    } else {
      toast.error(result.error ?? "Failed to delete product");
    }
  }

  function exportToCSV() {
    if (filteredProducts.length === 0) {
      toast.error("No products to export");
      return;
    }

    // Create CSV headers
    const headers = [
      "Product Name",
      "Category",
      "Unit Price",
      "Stock Count",
      "Total Asset Value (ZMW)",
    ];

    // Create CSV rows
    const rows = filteredProducts.map((product) => {
      const totalAssetValue = product.price * product.stock_quantity;
      return [
        `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in product name
        `"${product.category.replace(/"/g, '""')}"`,
        product.price.toFixed(2),
        product.stock_quantity.toString(),
        totalAssetValue.toFixed(2),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(
      `Exported ${filteredProducts.length} product${
        filteredProducts.length !== 1 ? "s" : ""
      }`
    );
  }

  function getProductStatus(product: Product) {
    const isOutOfStock = product.stock_quantity <= 0;
    const isLowStock =
      !isOutOfStock && product.stock_quantity <= product.low_stock_threshold;
    return { isOutOfStock, isLowStock };
  }

  function StatusBadge({ product }: { product: Product }) {
    const { isOutOfStock, isLowStock } = getProductStatus(product);
    if (isOutOfStock) {
      return (
        <Badge variant="destructive" className="text-xs">
          Out
        </Badge>
      );
    }
    if (isLowStock) {
      return (
        <Badge variant="warning" className="text-xs">
          Low
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="text-xs">
        In stock
      </Badge>
    );
  }

  function StockAdjuster({ product }: { product: Product }) {
    const currentStockValue = pendingStock[product.id] ?? product.stock_quantity;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          disabled={currentStockValue <= 0}
          onClick={() => handleQuickAdjust(product, -1)}
          aria-label={`Decrease stock for ${product.name}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          type="number"
          min={0}
          className="h-8 w-12 text-center shrink-0"
          value={currentStockValue}
          onChange={(e) =>
            setPendingStock({
              ...pendingStock,
              [product.id]: Number(e.target.value),
            })
          }
        />
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          onClick={() => handleQuickAdjust(product, 1)}
          aria-label={`Increase stock for ${product.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        {currentStockValue !== product.stock_quantity && (
          <Button
            size="sm"
            variant="secondary"
            className="text-xs shrink-0"
            onClick={() => handleStockSave(product)}
          >
            Save
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Inventory</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search products by name or category..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-zinc-600">
          Found {filteredProducts.length} product
          {filteredProducts.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Product</TableHead>
              <TableHead className="min-w-[100px]">Category</TableHead>
              <TableHead className="min-w-[80px]">Price</TableHead>
              <TableHead className="min-w-[120px]">Stock</TableHead>
              <TableHead className="min-w-[90px]">Status</TableHead>
              <TableHead className="text-right min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-zinc-900">
                    <span className="line-clamp-2">{product.name}</span>
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    <span className="line-clamp-1">{product.category}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell>
                    <StockAdjuster product={product} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge product={product} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(product)}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-zinc-500"
                >
                  {searchQuery
                    ? "No products found matching your search"
                    : "No products yet. Add one to get started!"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 md:hidden">
        {paginatedProducts.length > 0 ? (
          paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-sm text-zinc-500 line-clamp-1">
                    {product.category}
                  </p>
                </div>
                <StatusBadge product={product} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Price</span>
                <span className="font-medium text-zinc-900">
                  {formatCurrency(product.price)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-zinc-500">Stock</span>
                <StockAdjuster product={product} />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEditDialog(product)}
                  aria-label={`Edit ${product.name}`}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(product)}
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-zinc-500">
            {searchQuery
              ? "No products found matching your search"
              : "No products yet. Add one to get started!"}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-zinc-500">
            Showing {(currentPageInRange - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(
              currentPageInRange * ITEMS_PER_PAGE,
              filteredProducts.length
            )}{" "}
            of {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPageInRange <= 1}
              onClick={() => setCurrentPage(Math.max(1, currentPageInRange - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-zinc-600">
              Page {currentPageInRange} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPageInRange >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
      />
    </div>
  );
}
