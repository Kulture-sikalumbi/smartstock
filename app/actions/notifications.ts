"use server";

import nodemailer from "nodemailer";
import type { CartItem, PaymentMethod } from "@/lib/types";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export interface LowStockAlertInput {
  productName: string;
  currentStock: number;
  threshold: number;
}

export interface AdminAlertResult {
  success: boolean;
  error?: string;
}

export async function notifyLowStockTransition(input: {
  productName: string;
  previousStock: number | null;
  previousThreshold: number | null;
  currentStock: number;
  currentThreshold: number;
}): Promise<void> {
  const wasLowStock =
    input.previousStock !== null &&
    input.previousThreshold !== null &&
    input.previousStock <= input.previousThreshold;
  const isLowStock = input.currentStock <= input.currentThreshold;
  const becameOutOfStock =
    input.previousStock !== null &&
    input.previousStock > 0 &&
    input.currentStock <= 0;

  if ((!isLowStock || wasLowStock) && !becameOutOfStock) return;

  const result = await sendLowStockAlert({
    productName: input.productName,
    currentStock: input.currentStock,
    threshold: input.currentThreshold,
  });
  if (!result.success) {
    console.error(`Low-stock email failed for ${input.productName}:`, result.error);
  }
}

export interface NewOrderAlertInput {
  orderId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  items: CartItem[];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount);
}

async function sendAdminEmail(subject: string, html: string): Promise<AdminAlertResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Smart Stock Alerts <onboarding@resend.dev>";
  const gmailUser = process.env.GMAIL_USER?.trim() ?? "";
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "") ?? "";
  const requestedProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const provider = requestedProvider === "gmail" || requestedProvider === "resend"
    ? requestedProvider
    : gmailUser && gmailAppPassword
      ? "gmail"
      : apiKey
        ? "resend"
        : null;

  if (!provider) {
    return {
      success: false,
      error: "Configure Gmail app-password credentials or a Resend API key to send admin emails.",
    };
  }
  if (provider === "gmail" && (!gmailUser || !gmailAppPassword)) {
    return { success: false, error: "GMAIL_USER and GMAIL_APP_PASSWORD are required for Gmail delivery." };
  }
  if (provider === "resend" && !apiKey) {
    return { success: false, error: "RESEND_API_KEY is required for Resend delivery." };
  }
  try {
    let recipients: string[] = [];
    let loadedFromDatabase = false;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await getServerSupabase()
          .from("admin_notification_recipients")
          .select("email");
        if (!error) {
          recipients = (data ?? []).map((recipient) => recipient.email);
          loadedFromDatabase = true;
        }
      } catch {
        // Continue with ADMIN_EMAIL if Supabase can't be reached from this environment.
      }
    }
    // Keep the environment setting as a fallback for local setup and existing deployments.
    if (!loadedFromDatabase) {
      recipients = (process.env.ADMIN_EMAIL ?? "")
        .split(/[;,]/)
        .map((email) => email.trim())
        .filter(Boolean);
    }
    if (!recipients.length) {
      return { success: false, error: "No admin alert recipients are configured; skipping email." };
    }

    const safeSubject = subject.replace(/[\r\n]/g, " ");

    if (provider === "gmail") {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: gmailUser, pass: gmailAppPassword },
      });
      await transporter.sendMail({
        from: `Smart Stock Alerts <${gmailUser}>`,
        to: recipients.join(", "),
        subject: safeSubject,
        html,
      });
      return { success: true };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: safeSubject,
        html,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      const message =
        result && typeof result === "object" && "message" in result &&
        typeof result.message === "string"
          ? result.message
          : `Resend returned HTTP ${response.status}.`;
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send admin email.",
    };
  }
}

/** Send an admin alert when a product reaches its configured threshold. */
export async function sendLowStockAlert(
  input: LowStockAlertInput
): Promise<AdminAlertResult> {
  const isOutOfStock = input.currentStock <= 0;
  const productName = escapeHtml(input.productName);
  const subject = isOutOfStock
    ? `Out of stock: ${input.productName}`
    : `Low stock: ${input.productName}`;
  const heading = isOutOfStock ? "Out of Stock Alert" : "Low Stock Alert";
  const detail = isOutOfStock
    ? "This product is now out of stock. Restock it before accepting more orders."
    : "This product has fallen below its low-stock threshold. Please plan a restock.";

  return sendAdminEmail(
    subject,
    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#b91c1c">${heading}</h2>
      <p><strong>${productName}</strong> ${detail}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #e5e7eb">Current stock</td><td style="padding:8px;border:1px solid #e5e7eb"><strong>${input.currentStock}</strong></td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb">Low-stock threshold</td><td style="padding:8px;border:1px solid #e5e7eb">${input.threshold}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:12px">Sent automatically by Smart Stock.</p>
    </div>`
  );
}

/** Send one summary email for products that are already at or below their threshold. */
export async function sendLowStockSummary(
  products: LowStockAlertInput[]
): Promise<AdminAlertResult> {
  if (!products.length) {
    return { success: false, error: "There are no low-stock products to include in the summary." };
  }

  const rows = products
    .map((product) => {
      const status = product.currentStock <= 0 ? "Out of stock" : "Low stock";
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(product.productName)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${product.currentStock}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${product.threshold}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${status}</td>
      </tr>`;
    })
    .join("");

  return sendAdminEmail(
    `Current low-stock summary: ${products.length} product${products.length === 1 ? "" : "s"}`,
    `<div style="font-family:sans-serif;max-width:680px;margin:0 auto">
      <h2 style="color:#b91c1c">Current Stock Alert Summary</h2>
      <p>${products.length} product${products.length === 1 ? " is" : "s are"} at or below the configured low-stock threshold.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Product</th>
          <th style="padding:8px;border:1px solid #e5e7eb">Current stock</th>
          <th style="padding:8px;border:1px solid #e5e7eb">Threshold</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#6b7280;font-size:12px">Sent automatically by Smart Stock.</p>
    </div>`
  );
}

/** Send an admin alert once an order has completed successfully. */
export async function sendNewOrderAlert(
  input: NewOrderAlertInput
): Promise<AdminAlertResult> {
  const rows = input.items
    .map(
      (item) => `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(item.name)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${escapeHtml(formatCurrency(item.price * item.quantity))}</td>
      </tr>`
    )
    .join("");

  return sendAdminEmail(
    `New order completed: ${input.orderId}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#18181b">New Order Completed</h2>
      <p>Order <strong>${escapeHtml(input.orderId)}</strong> has been completed.</p>
      <p><strong>Customer:</strong> ${escapeHtml(input.customerName)}<br />
      <strong>Phone:</strong> ${escapeHtml(input.customerPhone)}<br />
      <strong>Payment:</strong> ${escapeHtml(input.paymentMethod.replaceAll("_", " "))}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr><th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Item</th><th style="padding:8px;border:1px solid #e5e7eb">Qty</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2" style="padding:8px;border:1px solid #e5e7eb"><strong>Total</strong></td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right"><strong>${escapeHtml(formatCurrency(input.totalAmount))}</strong></td></tr></tfoot>
      </table>
      <p style="color:#6b7280;font-size:12px">Sent automatically by Smart Stock.</p>
    </div>`
  );
}
