"use client";

import { useEffect, useState } from "react";
import { favoriteStorageKey, readFavorites, writeFavorites } from "@/lib/listing-utils";

interface Props {
  listingId: string;
  className?: string;
}

export function FavoriteButton({ listingId, className = "" }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readFavorites().has(listingId));
  }, [listingId]);

  function toggle() {
    const ids = readFavorites();
    if (ids.has(listingId)) {
      ids.delete(listingId);
      setSaved(false);
    } else {
      ids.add(listingId);
      setSaved(true);
    }
    writeFavorites(ids);
    window.dispatchEvent(new Event("ilanhub:favorites-changed"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Прибрати з обраного" : "Додати в обране"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${className} ${
        saved
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-amber-700"
      }`}
    >
      <span aria-hidden>{saved ? "⭐" : "☆"}</span>
      {saved ? "В обраному" : "Зберегти"}
    </button>
  );
}

export function isFavorite(listingId: string): boolean {
  return readFavorites().has(listingId);
}

export { favoriteStorageKey };
