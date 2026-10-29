"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addAdminNotificationRecipient,
  removeAdminNotificationRecipient,
  sendCurrentLowStockSummary,
  type AdminNotificationRecipient,
} from "@/app/admin/actions";

interface NotificationRecipientsProps {
  recipients: AdminNotificationRecipient[];
  setupError?: string;
}

export function NotificationRecipients({
  recipients,
  setupError,
}: NotificationRecipientsProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await addAdminNotificationRecipient(email);
      if (!result.success) {
        setMessageIsError(true);
        setMessage(result.error ?? "Couldn't add that email.");
        return;
      }
      setEmail("");
      setMessageIsError(false);
      setMessage("Email added to the alert list.");
      router.refresh();
    });
  }

  function handleRemove(recipient: AdminNotificationRecipient) {
    setMessage("");
    startTransition(async () => {
      const result = await removeAdminNotificationRecipient(recipient.id);
      if (!result.success) {
        setMessageIsError(true);
        setMessage(result.error ?? "Couldn't remove that email.");
        return;
      }
      setMessageIsError(false);
      setMessage(`${recipient.email} removed from the alert list.`);
      router.refresh();
    });
  }

  function handleSendSummary() {
    setMessage("");
    startTransition(async () => {
      const result = await sendCurrentLowStockSummary();
      if (!result.success) {
        setMessageIsError(true);
        setMessage(result.error ?? "Couldn't send the stock summary.");
        return;
      }
      setMessageIsError(false);
      setMessage(`Low-stock summary sent for ${result.count} product${result.count === 1 ? "" : "s"}.`);
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-zinc-900">Admin email alerts</h2>
          <p className="mt-1 text-sm text-zinc-500">
            These addresses receive new order, low-stock, and out-of-stock alerts. Verify your sender domain in Resend to deliver to real inboxes.
          </p>
        </div>
      </div>

      {setupError && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {setupError}
        </p>
      )}

      {!setupError && (
        <>
          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="admin-alert-email">Email address</Label>
              <Input
                id="admin-alert-email"
                type="email"
                autoComplete="email"
                placeholder="manager@example.com"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" disabled={isPending} className="sm:shrink-0">
              <Plus className="h-4 w-4" /> Add email
            </Button>
          </form>

          <div className="mt-5">
            {recipients.length ? (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                {recipients.map((recipient) => (
                  <li key={recipient.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="min-w-0 truncate text-sm text-zinc-800">{recipient.email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-zinc-500 hover:text-red-700"
                      aria-label={`Remove ${recipient.email}`}
                      disabled={isPending}
                      onClick={() => handleRemove(recipient)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-5 text-center text-sm text-zinc-500">
                No alert recipients yet. Add an email address above.
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-lg bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          Send one email listing products that are currently at or below their stock thresholds.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleSendSummary}
          className="shrink-0"
        >
          <Send className="h-4 w-4" /> Send current summary
        </Button>
      </div>

      {message && (
        <p role="status" className={`mt-3 text-sm ${messageIsError ? "text-red-700" : "text-green-700"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
