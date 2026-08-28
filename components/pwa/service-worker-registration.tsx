"use client";

import { useEffect } from "react";

/**
 * Registers the Service Worker (public/sw.js) on mount so static assets
 * are cached for offline responsiveness.
 *
 * public/sw.js calls `self.skipWaiting()` on install and `clients.claim()`
 * on activate, so a newly deployed worker takes control of open tabs
 * immediately instead of waiting for them to be closed. When that handoff
 * happens (`controllerchange`), we reload the page once so the client
 * picks up the new build right away instead of continuing to run stale
 * cached HTML/JS from before the deployment.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;
    let didRegister = false;

    const handleControllerChange = () => {
      // Ignore the initial controllerchange that fires on first install
      // (no previous controller to replace); only reload for real updates.
      if (!didRegister || refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          didRegister = true;
          // Proactively check for a fresher sw.js instead of waiting for
          // the browser's own (infrequent) periodic update check.
          registration.update().catch(() => {});
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    };

    window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  return null;
}
