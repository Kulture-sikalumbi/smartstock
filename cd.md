Build a Next.js (App Router, TypeScript) e-commerce marketplace called Smart Stock for SMEs using Tailwind CSS, Shadcn UI patterns, and Lucide icons.

Core Architecture & Features:

Public Storefront (/): Responsive product grid with category filtering, search bar, product detail page (/product/[id]), and a Zustand cart drawer configured with persistent local storage.

Simulated Payment Gateway: A checkout modal allowing buyers to select MTN MoMo, Airtel Money, or Bank Card. Include a 3-second loading animation simulating the USSD/Bank prompt that writes a completed order to Supabase upon success.

Admin Dashboard (/admin): Display revenue summary cards, top-selling and least-selling products (aggregated from order history), low-stock alert banners (where stock_quantity <= low_stock_threshold), and a full CRUD inventory table to edit stock quantities.

Supabase Integration: Provide the SQL schema setup script for products, orders, and order_items tables, plus an automated SQL function/trigger that decrements stock_quantity when an order reaches COMPLETED status.

Summary

Ai agent:I built out the full **Smart Stock** marketplace per `smartstock/cd.md`. Here's what's in place:

**Foundation**
- `lib/types.ts`, `lib/constants.ts` — shared types & payment/category constants
- `lib/supabase/client.ts` (browser, anon key) and `lib/supabase/server.ts` (service role, for writes)
- `lib/data.ts` / `lib/admin-data.ts` — storefront and admin queries, with a `lib/mock-data.ts` fallback so the app runs before Supabase is connected
- `store/cart-store.ts` — Zustand cart with `persist` (localStorage)
- `components/ui/*` — hand-built shadcn-style primitives (button, input, dialog, sheet, select, tabs, table, card, badge, label, textarea) on Radix + CVA + Tailwind v4

**Storefront** (`app/page.tsx`, `app/product/[id]/page.tsx`)
- Responsive product grid, category filter and search via URL params, product detail page, cart drawer (`components/storefront/*`)

**Checkout** (`components/storefront/checkout-modal.tsx`, `app/actions/orders.ts`)
- Payment method picker (MTN MoMo / Airtel Money / Bank Card), 3s simulated USSD/bank prompt, then a Server Action that inserts a `PENDING` order + items and flips it to `COMPLETED`

**Admin dashboard** (`app/admin/page.tsx`, `components/admin/*`)
- Revenue/order stat cards, top/least-selling product rankings, low-stock banner, full CRUD inventory table (`app/admin/actions.ts`)

**Supabase** (`sql/schema.sql`)
- `products`, `orders`, `order_items` tables, RLS policies, and a trigger (`trg_decrement_stock_on_completed_order`) that decrements `stock_quantity` the moment an order's status becomes `COMPLETED`
- `.env.local.example` + `README.md` walk through connecting a real project

**Validation:** `npm run build -- --webpack` compiles, type-checks, and generates all routes successfully; `npm run lint` is clean (fixed two `react-hooks/set-state-in-effect` issues by switching to key-based remounts instead of effects).

**Note on your environment:** the native `@next/swc-win32-x64-msvc` binary is corrupted/invalid on this machine, so Next.js falls back to WASM (works fine, just slower/noisier). Turbopack isn't available for that reason — I used `next build --webpack`. If you want, I can try `npm rebuild` or reinstalling that one package to restore native Turbopack.

**Next steps for you:**
1. `npm run dev` in `smartstock/` — the storefront/admin work now with sample data.
2. Follow `smartstock/README.md` to connect Supabase (run `sql/schema.sql`, copy `.env.local.example` → `.env.local`) to enable real checkout and inventory CRUD.

Ai agent:Want me to also set up a seed/reset script, or wire up authentication for `/admin` before you deploy this anywhere public?
