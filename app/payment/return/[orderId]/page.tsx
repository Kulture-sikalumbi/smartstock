import { notFound } from "next/navigation";
import { PaymentReturnStatus } from "@/components/storefront/payment-return-status";

export default async function PaymentReturnPage({
  params,
}: PageProps<"/payment/return/[orderId]">) {
  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound();

  return <PaymentReturnStatus orderId={orderId} />;
}
