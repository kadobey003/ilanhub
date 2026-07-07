"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ilanhub-promo-dismissed";

export function PromoTopBanner({
  id,
  text,
  href,
  cta,
}: {
  id: string;
  text: string;
  href?: string;
  cta?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed !== id) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [id]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-3 text-white shadow-md shadow-orange-200/50 sm:px-5">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="relative flex items-center gap-3">
        <p className="flex-1 text-xs font-medium leading-snug sm:text-sm">
          {href ? (
            <Link href={href} className="hover:underline">
              {text}
            </Link>
          ) : (
            text
          )}
        </p>
        {cta && href && (
          <Link
            href={href}
            className="hidden shrink-0 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition hover:bg-white/30 sm:inline-block"
          >
            {cta}
          </Link>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label="Закрити"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
