import { SiteHeader } from "@/components/storefront/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <Skeleton className="h-5 w-32" />

        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />

          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-32" />
            <div className="flex flex-col gap-2 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
