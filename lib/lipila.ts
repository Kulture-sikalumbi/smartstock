import { createHmac, timingSafeEqual } from "node:crypto";

export type LipilaPaymentStatus = "Pending" | "Successful" | "Failed";

interface LipilaTransaction {
  referenceId: string;
  amount: number | string;
  currency: string;
  status: string;
  type?: string;
  paymentType?: string;
  identifier?: string;
  message?: string;
  cardRedirectionUrl?: string | null;
}

interface LipilaResponse extends LipilaTransaction {
  data?: LipilaTransaction;
}

export interface StartLipilaPaymentInput {
  orderId: string;
  amount: number;
  paymentMethod: "MOBILE_MONEY";
  customerPhone: string;
}

export class LipilaApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "LipilaApiError";
  }
}

function getApiConfiguration() {
  const apiKey = process.env.LIPILA_API_KEY;
  if (!apiKey) throw new Error("Lipila payments are not configured.");

  const baseUrl =
    process.env.LIPILA_ENV === "production"
      ? "https://blz.lipila.io/api/v1"
      : "https://api.lipila.dev/api/v1";

  return { apiKey, baseUrl };
}

async function lipilaRequest<T>(path: string, init: RequestInit): Promise<T> {
  const { apiKey, baseUrl } = getApiConfiguration();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok || !body) {
    const message =
      body && typeof body.message === "string"
        ? body.message
        : `Lipila returned HTTP ${response.status}.`;
    throw new LipilaApiError(message, response.status);
  }

  return body;
}

export function normalizeZambianPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("260")
    ? digits
    : digits.startsWith("0")
      ? `260${digits.slice(1)}`
      : `260${digits}`;

  return /^260\d{9}$/.test(international) ? international : null;
}

export async function startLipilaPayment(
  input: StartLipilaPaymentInput
): Promise<{ status: LipilaPaymentStatus; redirectUrl?: string }> {
  const callbackUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL("/api/payments/lipila/webhook", process.env.NEXT_PUBLIC_SITE_URL).toString()
    : undefined;
  const result = await lipilaRequest<LipilaResponse>("/collections/mobile-money", {
    method: "POST",
    headers: callbackUrl ? { callbackUrl } : undefined,
    body: JSON.stringify({
      referenceId: input.orderId,
      amount: input.amount,
      narration: "SmartStock product purchase",
      accountNumber: input.customerPhone,
      currency: "ZMW",
      referenceData: `SmartStock order ${input.orderId}`,
    }),
  });

  const transaction = result.data ?? result;
  const status = normalizeLipilaStatus(transaction.status);
  if (!status) throw new Error("Lipila returned an unknown payment status.");

  return { status };
}

function normalizeLipilaStatus(status: string): LipilaPaymentStatus | null {
  switch (status.toLowerCase()) {
    case "pending":
    case "submitted":
    case "initiated":
    case "accepted":
      return "Pending";
    case "successful":
    case "completed":
      return "Successful";
    case "failed":
      return "Failed";
    default:
      return null;
  }
}

export async function getLipilaPaymentStatus(
  referenceId: string
): Promise<LipilaTransaction> {
  const params = new URLSearchParams({ referenceId });
  const result = await lipilaRequest<LipilaResponse>(
    `/collections/check-status?${params.toString()}`,
    { method: "GET" }
  );
  return result.data ?? result;
}

export function verifyLipilaWebhook(
  rawBody: string,
  headers: Headers
): boolean {
  const configuredSecret = process.env.LIPILA_WEBHOOK_SECRET;
  const webhookId = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");

  if (!configuredSecret || !webhookId || !timestamp || !signatures) return false;
  const timestampSeconds = Number(timestamp);
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > 300
  ) {
    return false;
  }

  const base64Secret = configuredSecret.startsWith("whsec_")
    ? configuredSecret.slice("whsec_".length)
    : configuredSecret;
  let key: Buffer;
  try {
    key = Buffer.from(base64Secret, "base64");
  } catch {
    return false;
  }
  if (key.length !== 32) return false;

  const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
  const expected = Buffer.from(
    `v1,${createHmac("sha256", key).update(signedPayload).digest("base64")}`
  );

  return signatures.split(" ").some((signature) => {
    const received = Buffer.from(signature.trim());
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}
