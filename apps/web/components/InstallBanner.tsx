"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const stored = localStorage.getItem("pwa-install-dismissed");
    if (stored) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "dismissed") {
      localStorage.setItem("pwa-install-dismissed", "1");
      setDismissed(true);
    }
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 animate-fade-in md:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-lg text-white">
          📲
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Встановити додаток</p>
          <p className="text-xs text-slate-500">Швидкий доступ з головного екрану</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white"
        >
          Встановити
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-slate-400"
          aria-label="Закрити"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
