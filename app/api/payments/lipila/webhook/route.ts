import { refreshLipilaOrder } from "@/lib/payments/lipila-orders";
import { verifyLipilaWebhook } from "@/lib/lipila";

interface LipilaWebhookPayload {
  status?: unknown;
  referenceId?: unknown;
  data?: {
    status?: unknown;
    referenceId?: unknown;
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyLipilaWebhook(rawBody, request.headers)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: LipilaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LipilaWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const referenceId = payload.data?.referenceId ?? payload.referenceId;
  if (typeof referenceId !== "string" || !/^[0-9a-f-]{36}$/i.test(referenceId)) {
    return Response.json({ error: "Missing order reference." }, { status: 400 });
  }

  const callbackStatus = String(payload.data?.status ?? payload.status ?? "").toLowerCase();
  const result = await refreshLipilaOrder(referenceId);
  if (result.status === "UNKNOWN") {
    return Response.json({ error: "Order could not be checked." }, { status: 503 });
  }

  const callbackIsTerminal = ["successful", "completed", "failed"].includes(callbackStatus);
  if (callbackIsTerminal && result.status === "PENDING") {
    return Response.json({ error: "Lipila transaction could not yet be verified." }, { status: 503 });
  }

  return Response.json({ received: true });
}
