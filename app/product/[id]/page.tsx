import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageX } from "lucide-react";
import { SiteHeader } from "@/components/storefront/site-header";
import { Badge } from "@/components/ui/badge";
import { AddToCartSection } from "@/components/storefront/add-to-cart-section";
import { getProductById } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock =
    !isOutOfStock && product.stock_quantity <= product.low_stock_threshold;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <PackageX className="h-16 w-16" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {product.category}
          </span>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {product.name}
          </h1>

          <div className="flex items-center gap-2">
            {isOutOfStock && <Badge variant="destructive">Out of stock</Badge>}
            {isLowStock && <Badge variant="warning">Low stock</Badge>}
            {!isOutOfStock && !isLowStock && (
              <Badge variant="success">In stock</Badge>
            )}
          </div>

          <p className="text-3xl font-bold text-zinc-900">
            {formatCurrency(product.price)}
          </p>

          <p className="leading-relaxed text-zinc-600">
            {product.description ?? "No description available."}
          </p>

          <AddToCartSection product={product} />
        </div>
        </div>
      </main>
    </div>
  );
}
