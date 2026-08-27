"use server";

import { Resend } from "resend";

export interface LowStockAlertInput {
  productName: string;
  currentStock: number;
  threshold: number;
}

export interface LowStockAlertResult {
  success: boolean;
  error?: string;
}

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const adminEmail = process.env.ADMIN_EMAIL ?? "";

// `onboarding@resend.dev` is Resend's shared sandbox sender, usable without
// a verified custom domain — handy for local development and testing.
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function buildLowStockEmailHtml({
  productName,
  currentStock,
  threshold,
}: LowStockAlertInput): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #b91c1c;">⚠️ Low Stock Alert</h2>
      <p><strong>${productName}</strong> has fallen below its low-stock threshold.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">Current stock</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${currentStock}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">Low-stock threshold</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${threshold}</td>
        </tr>
      </table>
      <p>Please restock this product soon to avoid running out.</p>
      <p style="color: #6b7280; font-size: 12px;">Sent automatically by Smart Stock IMS.</p>
    </div>
  `;
}

/**
 * Sends a low-stock HTML alert email to the configured admin address.
 * No-ops gracefully (without throwing) when Resend isn't configured, so
 * checkout never fails because of a missing/invalid email setup.
 */
export async function sendLowStockAlert(
  input: LowStockAlertInput
): Promise<LowStockAlertResult> {
  const { productName, currentStock, threshold } = input;

  if (!resend) {
    return {
      success: false,
      error: "RESEND_API_KEY isn't configured; skipping low-stock email.",
    };
  }

  if (!adminEmail) {
    return {
      success: false,
      error: "ADMIN_EMAIL isn't configured; skipping low-stock email.",
    };
  }

  try {
    const { error } = await resend.emails.send({
      from: `Smart Stock IMS <${fromEmail}>`,
      to: adminEmail,
      subject: `Low stock: ${productName}`,
      html: buildLowStockEmailHtml({ productName, currentStock, threshold }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}
