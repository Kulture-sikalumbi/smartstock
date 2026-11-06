# Smart Stock

Smart Stock is a full-stack e-commerce and inventory platform for small and medium-sized businesses. The project combines a storefront, checkout flow, inventory dashboard, stock management, and low-stock notifications in a single Next.js application powered by Supabase.

## Overview

This application helps SMEs:

- showcase products online,
- sell stock through a mobile-money or card-style checkout flow,
- automatically track inventory changes,
- review sales performance from an admin dashboard,
- receive low-stock alerts when items fall below their configured threshold.

The app is designed for Zambian commerce, with Lipila-detected MTN MoMo, Airtel Money, Zamtel Kwacha, and hosted bank-card payments.

## Key features

- Storefront browsing and product search
- Customer account registration and email/password sign-in via Supabase Auth
- Category filtering and product detail pages
- Persistent cart using Zustand
- Lipila mobile-money checkout that detects MTN, Airtel, or Zamtel from the customer's phone number, plus hosted card payments
- Inventory management and revenue overview in the admin dashboard
- Admin email alerts for new completed orders, low stock, and out-of-stock products via Gmail SMTP or Resend
- Send a one-off summary email for products already at or below their stock thresholds
- Manage multiple admin alert recipient emails from the dashboard
- PWA support for installability and offline static asset caching
- Supabase-backed data layer with inventory reservation while payment is pending

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Nodemailer with Gmail SMTP or Resend email API
- Zustand state management
- Shadcn-style UI components

## Application flow

1. Customers browse products and add items to the cart.
2. The checkout action validates stock on the server.
3. The server re-reads product prices and stock, creates a pending order, reserves stock, and starts a Lipila collection.
4. Lipila's signed callback or the checkout status check verifies the transaction amount, currency, and reference with Lipila before moving the order to `COMPLETED`.
5. Failed transactions release their stock reservation. Successful orders trigger admin email alerts.

## Project structure

```text
app/
  admin/
  actions/
  api/
  product/
  page.tsx
components/
  admin/
  storefront/
  ui/
  pwa/
lib/
  admin-data.ts
  data.ts
  mock-data.ts
  lipila.ts
  types.ts
  supabase/
  utils.ts
supabase/
  migrations/
  config.toml
store/
  cart-store.ts
sql/
  schema.sql
public/
  manifest.json
  sw.js
  icons/
scripts/
  generate-placeholder-icons.js
```

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 20+
- npm
- A Supabase project
- A Gmail account with an App Password or a Resend account if you want admin email alerts enabled

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the sample environment file:

   ```bash
   copy .env.local.example .env.local
   ```

3. Fill in the required values in `.env.local`.

4. Run the SQL schema in your Supabase project:

   ```text
   sql/schema.sql
   ```

   For an existing database, use the Supabase CLI to link and pull its schema before applying new migrations. Do not run the full schema file over a populated production database.
   Run `sql/admin-notification-recipients.sql` on an existing project if the admin email-recipient settings table is missing.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the application at http://localhost:3000

## Environment variables

The app expects the following values in `.env.local`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EMAIL_PROVIDER=gmail
GMAIL_USER=your-demo-account@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
# Optional Resend alternative: set EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_your-resend-api-key
# RESEND_FROM_EMAIL=Smart Stock Alerts <alerts@your-verified-domain.com>
ADMIN_EMAIL=admin@example.com
```

Notes:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are required for live database-backed functionality.
- `LIPILA_API_KEY` is required for checkout. Start with the sandbox dashboard and key; set `LIPILA_ENV=production` only with a live key.
- `LIPILA_WEBHOOK_SECRET` verifies Lipila callback signatures. Configure the callback URL as `https://<your-domain>/api/payments/lipila/webhook` in Lipila.
- `NEXT_PUBLIC_SITE_URL` must be the canonical site origin so Lipila can return customers from hosted card checkout.
- `NEXT_PUBLIC_*` variables are intentionally not preferred here because the app reads runtime environment variables on the server instead of inlining them during build.
- Without Supabase configuration, the app falls back to sample/mock catalog data so the UI can still render.
- Email alerts are optional; payment processing does not depend on email delivery.
- Gmail is the simplest demo option for sending to real inboxes: turn on Google 2-Step Verification and create an App Password. Use `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env.local`; never use your normal Google password. Google documents the App Password requirements [here](https://support.google.com/accounts/answer/185833?hl=en).
- `ADMIN_EMAIL` is retained as a fallback for local setup and older deployments; once the Supabase recipient table is available, the dashboard list controls alert recipients.
- To use Resend instead, set `EMAIL_PROVIDER=resend`, keep `RESEND_API_KEY` secret, and send from a verified domain. See [Resend's verified-domain guide](https://resend.com/docs/dashboard/domains/introduction).

## Admin access

The admin dashboard is protected by a simple 4-digit PIN. The current default PIN is:

```text
1234
```

This is set in `components/admin/admin-pin-gate.tsx` and is intended for local/demo use.

## Customer accounts

Customers can create an account or sign in from the **Sign in** button in the storefront header, or by opening `/account`. With Supabase configured, accounts use Supabase Auth with email and password; the registration form saves the customer's full name in user metadata and returns confirmation links to the current site origin. If email confirmation is enabled, customers must confirm their email before signing in.

For hosted projects, add each site origin to Supabase Auth's **URL Configuration** redirect allow list, including the localhost port used by `npm run dev` and the Azure site. Supabase's built-in Auth mailer is limited to project team addresses; configure custom SMTP in Supabase Auth to deliver confirmation emails to arbitrary inboxes. The Gmail/Resend settings used by this app for admin alerts do not configure Supabase Auth mail delivery. Without Supabase configured, the page uses browser-only presentation accounts; these are not real customer accounts.

## Admin email recipients

Open **Admin Dashboard → Settings** to add or remove the email addresses that receive completed-order and stock alerts. Select **Send current summary** to email the products already at or below their thresholds. The recipient list is stored in Supabase. Run `sql/admin-notification-recipients.sql` before using recipient management on an existing project. For delivery to real inboxes, configure Gmail SMTP or a verified Resend sender domain; the Resend sandbox sender is for testing only.

## Supabase CLI

The Supabase CLI is installed as a project dependency. Sign in and link this working copy to the existing project, then pull its schema:

```powershell
npx supabase login
npx supabase link --project-ref pbevjiodbhgnusqdcyyq
npx supabase db pull --remote
```

The CLI login and database password stay in your local terminal. This existing project needs a baseline migration before new changes are pushed. The baseline and payment migrations are in `supabase/migrations`; review them before deploying any database changes.

## Lipila payments

Configure the server-only values in `.env.local` and in the production host:

```text
LIPILA_API_KEY=...
LIPILA_WEBHOOK_SECRET=...
LIPILA_ENV=sandbox
NEXT_PUBLIC_SITE_URL=https://your-store.example
```

Use a Lipila sandbox account and test key first. The production API uses the live key and `LIPILA_ENV=production`. The code sends mobile-money collections for the entered Zambian phone number and lets Lipila detect the mobile network; card checkout redirects to Lipila's hosted card page. Configure the callback URL and enable transaction callbacks in the Lipila merchant dashboard. Keep API keys and webhook secrets out of browser code and version control.

The checkout checks the `lipila_checkout_ready()` database function before creating any payment. It stays disabled until the payment migrations are applied, including the stock-reservation triggers and mobile-money payment method.

## Database schema

The database layer is defined in [`sql/schema.sql`](./sql/schema.sql). It creates:

- `public.products`
- `public.orders`
- `public.order_items`
- `public.admin_notification_recipients`
- inventory reservation and release triggers for pending and failed payments
- row-level security policies
- seed data for sample products

The key behavior is:

- order items are stored in `order_items`
- an order moves from `PENDING` to `COMPLETED`
- stock is reserved atomically when pending order items are inserted
- failed payments release the stock reservation; completed payments do not deduct stock a second time
- low-stock checks run after purchase completion to trigger email alerts

## Deployment

For production deployment, set the same environment variables in your host or platform environment (for example Vercel, Azure App Service, or any Node-based deployment provider).

Important deployment notes:

- keep `SUPABASE_SERVICE_ROLE_KEY` server-side only,
- do not expose it to the browser,
- ensure the database schema has been applied before production traffic begins,
- use the application runtime environment, not build-time hardcoded variables, for Supabase config.

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for a deeper deployment checklist.

## Development notes

For local development and contribution guidance, see [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

## Academic project documentation

For the supervisor-facing project report, see [docs/PROJECT-DOCUMENTATION.md](./docs/PROJECT-DOCUMENTATION.md). It covers the background, objectives, scope, requirements, architecture, database design, process flows, testing plan, limitations, and future improvements.

## Troubleshooting

- If the storefront shows mock data only, check that `.env.local` contains valid `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values.
- If checkout is unavailable, check `LIPILA_API_KEY`, `LIPILA_ENV`, Supabase server access, and that the Lipila stock/payment migrations have been applied.
- If admin alerts do not send, confirm the selected provider's credentials, the Supabase recipient list (or fallback `ADMIN_EMAIL`), and Gmail/Resend delivery requirements.
- If the admin dashboard is locked, use the default PIN `1234`.

## License

This project is provided as a working application template for SME commerce operations and is intended for local development and demonstration use unless otherwise specified by the repository owner.
