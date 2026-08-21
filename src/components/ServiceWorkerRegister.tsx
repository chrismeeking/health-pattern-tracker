"use client";

import { useEffect } from "react";

/** Register the minimal service worker for PWA installability. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is best-effort — ignore failures
    });
  }, []);

  return null;
}
