"use client";

import { useEffect } from "react";

/**
 * Registers the Service Worker (public/sw.js) on mount so static assets
 * are cached for offline responsiveness. Renders nothing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
