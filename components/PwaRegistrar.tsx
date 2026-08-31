"use client";

import { useEffect } from "react";

export default function PwaRegistrar() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

        console.log(
          "🥔 Service Worker 등록 완료:",
          registration.scope
        );
      } catch (error) {
        console.error(
          "❌ Service Worker 등록 실패:",
          error
        );
      }
    };

    if (
      document.readyState === "complete"
    ) {
      registerServiceWorker();
    } else {
      window.addEventListener(
        "load",
        registerServiceWorker
      );
    }

    return () => {
      window.removeEventListener(
        "load",
        registerServiceWorker
      );
    };
  }, []);

  return null;
}