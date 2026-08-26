import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { Order, PaymentMethod } from "@/lib/types";

const PAYMENT_BADGE_VARIANT: Record<
  PaymentMethod,
  "warning" | "destructive" | "secondary"
> = {
  MTN_MOMO: "warning",
  AIRTEL_MONEY: "destructive",
  BANK_CARD: "secondary",
};

function getPaymentMethod(method: PaymentMethod) {
  return PAYMENT_METHODS.find((m) => m.value === method);
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">
          Completed orders
        </h2>
        <span className="text-sm text-zinc-500">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">Order</TableHead>
              <TableHead className="min-w-[140px]">Customer</TableHead>
              <TableHead className="min-w-[100px]">Payment</TableHead>
              <TableHead className="min-w-[60px]">Items</TableHead>
              <TableHead className="min-w-[90px]">Total</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-zinc-500"
                >
                  No completed orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const itemCount =
                  order.order_items?.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  ) ?? 0;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-zinc-500 whitespace-nowrap">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-zinc-900 line-clamp-1">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-zinc-500 line-clamp-1">
                        {order.customer_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={getPaymentMethod(order.payment_method)?.icon}
                          alt={getPaymentMethod(order.payment_method)?.label}
                          className="h-6 w-6 object-contain"
                        />
                        <Badge variant={PAYMENT_BADGE_VARIANT[order.payment_method]} className="text-xs">
                          {getPaymentMethod(order.payment_method)?.label ?? order.payment_method}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-center">{itemCount}</TableCell>
                    <TableCell className="font-medium text-zinc-900">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(order.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
