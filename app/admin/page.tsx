import Link from "next/link";
import { ArrowLeft, DollarSign, Package, Receipt } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { LowStockBanner } from "@/components/admin/low-stock-banner";
import { SalesRanking } from "@/components/admin/sales-ranking";
import { InventoryTable } from "@/components/admin/inventory-table";
import { OrdersTable } from "@/components/admin/orders-table";
import { AdminPinGate } from "@/components/admin/admin-pin-gate";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getRevenueStats,
  getProductSalesRanking,
  getLowStockProducts,
  getAllProductsForAdmin,
  getCompletedOrdersForAdmin,
} from "@/lib/admin-data";
import { formatCurrency } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function AdminPage() {
  const [stats, ranking, lowStockProducts, products, orders] =
    await Promise.all([
      getRevenueStats(),
      getProductSalesRanking(),
      getLowStockProducts(),
      getAllProductsForAdmin(),
      getCompletedOrdersForAdmin(),
    ]);

  return (
    <AdminPinGate>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to storefront
            </Link>
            <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
              Admin Dashboard
            </h1>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connect Supabase to see live revenue, sales ranking, and enable
            inventory editing. See{" "}
            <code className="rounded bg-amber-100 px-1">sql/schema.sql</code>{" "}
            and <code className="rounded bg-amber-100 px-1">.env.local</code>.
          </div>
        )}

        <LowStockBanner products={lowStockProducts} />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-3 sm:gap-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <StatCard
                title="Total revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={DollarSign}
                accent="emerald"
              />
              <StatCard
                title="Completed orders"
                value={stats.totalOrders.toString()}
                icon={Receipt}
              />
              <StatCard
                title="Average order value"
                value={formatCurrency(stats.averageOrderValue)}
                icon={Package}
              />
            </div>

            <SalesRanking
              topSelling={ranking.topSelling}
              leastSelling={ranking.leastSelling}
            />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTable products={products} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTable orders={orders} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPinGate>
  );
}
