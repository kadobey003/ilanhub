"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  images: { url: string; sortOrder: number }[];
  title: string;
}

export function AutoPhotoGallery({ images, title }: Props) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [active, setActive] = useState(0);
  const current = sorted[active]?.url;

  if (!sorted.length) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        Немає фото
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-900 shadow-lg">
        {current && (
          <Image
            src={current}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 70vw"
            priority
          />
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
          {active + 1} / {sorted.length}
        </span>
      </div>
      {sorted.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active ? "border-emerald-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
