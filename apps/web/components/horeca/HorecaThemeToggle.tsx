"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ilanhub:horeca-dark";

interface Props {
  variant?: "hero" | "inline";
}

export function HorecaThemeToggle({ variant = "hero" }: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "1";
    setDark(stored);
    document.documentElement.classList.toggle("horeca-dark", stored);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    document.documentElement.classList.toggle("horeca-dark", next);
  }

  const cls =
    variant === "hero"
      ? "rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
      : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-amber-300";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Світла тема" : "Темна тема"}
      className={cls}
    >
      {dark ? "☀️ Світла" : "🌙 Темна"}
    </button>
  );
}
