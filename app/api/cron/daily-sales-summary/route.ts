import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendDailySalesSummary } from "@/app/actions/notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.DAILY_SALES_CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const expected = secret ? Buffer.from(`Bearer ${secret}`) : Buffer.alloc(0);
  const received = Buffer.from(authorization);

  if (
    expected.length === 0 ||
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await sendDailySalesSummary();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
