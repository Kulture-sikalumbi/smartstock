import { SiteHeader } from "@/components/storefront/site-header";
import { ProductBrowser } from "@/components/storefront/product-browser";
import { getProducts, getCategories } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface HomeProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { category, search } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts({ category, search }),
    getCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Showing sample products. Connect Supabase (see{" "}
            <code className="rounded bg-amber-100 px-1">sql/schema.sql</code>{" "}
            and <code className="rounded bg-amber-100 px-1">.env.local</code>)
            to use live inventory and checkout.
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Shop local SME products
          </h1>
          <p className="text-zinc-500">
            Fresh finds across electronics, groceries, fashion, and more.
          </p>
        </div>

        <ProductBrowser products={products} categories={categories} />
      </main>
    </div>
  );
}
