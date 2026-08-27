"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Chrome/Edge/Android fire this instead of showing their own install UI. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_STORAGE_KEY = "smartstock:install-prompt-dismissed-at";
const DISMISS_SNOOZE_DAYS = 7;

function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorWithIosFlag = window.navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithIosFlag.standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const dismissedAt = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
  if (!dismissedAt) return false;
  const daysSinceDismissal =
    (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
  return daysSinceDismissal < DISMISS_SNOOZE_DAYS;
}

/**
 * Custom PWA install UI, since mobile browsers (especially iOS Safari)
 * never surface a native install popup automatically.
 *
 * - Android/Desktop Chrome: captures `beforeinstallprompt` and renders a
 *   sliding bottom banner that triggers the native install flow on tap.
 * - iOS Safari: there is no install API at all, so we show instructions
 *   for the manual "Share -> Add to Home Screen" flow instead.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    if (isRunningStandalone() || wasRecentlyDismissed()) return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    const isIos = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
    if (isIos) {
      setShowIosBanner(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, String(Date.now()));
    setShowAndroidBanner(false);
    setShowIosBanner(false);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowAndroidBanner(false);
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, String(Date.now()));
  }, [deferredPrompt]);

  if (!showAndroidBanner && !showIosBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Install SmartStock app"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-8 duration-300"
    >
      <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          {showIosBanner ? (
            <SquarePlus className="h-5 w-5" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1 text-sm">
          {showAndroidBanner ? (
            <>
              <p className="font-medium text-zinc-900">
                Install SmartStock App for a faster experience
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={handleInstallClick}>
                  Install
                </Button>
                <Button size="sm" variant="ghost" onClick={dismiss}>
                  Not now
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-zinc-900">
                Install SmartStock for a faster experience
              </p>
              <p className="mt-1 text-zinc-500">
                To install SmartStock: tap the Share button{" "}
                <Share className="inline h-3.5 w-3.5 -translate-y-0.5" />{" "}
                then select &quot;Add to Home Screen&quot;.
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
