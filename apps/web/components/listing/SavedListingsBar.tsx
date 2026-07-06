"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readFavorites } from "@/lib/listing-utils";

interface Props {
  project: string;
}

export function SavedListingsBar({ project }: Props) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    function refresh() {
      setIds([...readFavorites()]);
    }
    refresh();
    window.addEventListener("ilanhub:favorites-changed", refresh);
    return () => window.removeEventListener("ilanhub:favorites-changed", refresh);
  }, []);

  if (!ids.length) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">
        ⭐ Збережено: {ids.length}{" "}
        {ids.length === 1 ? "оголошення" : "оголошень"}
      </p>
      <p className="mt-1 text-xs text-amber-800/80">
        Відкрийте збережені оголошення зі списку нижче або{" "}
        <Link href={`/${project}/ogoloshennya`} className="font-semibold underline">
          перегляньте всі
        </Link>
      </p>
    </div>
  );
}
