"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 100;
const TRICKLE_INTERVAL_MS = 300;
const FINISH_HOLD_MS = 200;

/**
 * Lightweight top-of-page loading bar. Shows automatically whenever the user
 * clicks an internal link that leads to a different URL, and hides itself
 * once the destination route/searchParams have actually changed. Navigations
 * shorter than SHOW_DELAY_MS never flash the bar at all.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const navigating = useRef(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (trickleTimer.current) clearInterval(trickleTimer.current);
    if (finishTimer.current) clearTimeout(finishTimer.current);
    showTimer.current = null;
    trickleTimer.current = null;
    finishTimer.current = null;
  }, []);

  const start = useCallback(() => {
    if (navigating.current) return;
    navigating.current = true;
    clearTimers();
    showTimer.current = setTimeout(() => {
      setProgress(20);
      setVisible(true);
      trickleTimer.current = setInterval(() => {
        setProgress((p) => (p < 85 ? p + Math.random() * 10 : p));
      }, TRICKLE_INTERVAL_MS);
    }, SHOW_DELAY_MS);
  }, [clearTimers]);

  const finish = useCallback(() => {
    if (!navigating.current) return;
    navigating.current = false;
    clearTimers();
    setProgress(100);
    finishTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, FINISH_HOLD_MS);
  }, [clearTimers]);

  // The destination has rendered once pathname/searchParams settle.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const current = window.location.pathname + window.location.search;
      const next = url.pathname + url.search;
      if (current === next) return;

      start();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-100 h-1 bg-transparent">
      <div
        className="h-full bg-zinc-900 shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
