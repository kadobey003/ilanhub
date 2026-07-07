"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PlatformAnnouncement } from "@/lib/landing-promos";

const TYPE_STYLES: Record<PlatformAnnouncement["type"], string> = {
  info: "bg-blue-50 text-blue-700 border-blue-100",
  promo: "bg-amber-50 text-amber-800 border-amber-100",
  urgent: "bg-rose-50 text-rose-700 border-rose-100",
};

const TYPE_LABEL: Record<PlatformAnnouncement["type"], string> = {
  info: "Новина",
  promo: "Акція",
  urgent: "Важливо",
};

function AnnouncementItem({ item }: { item: PlatformAnnouncement }) {
  const inner = (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${TYPE_STYLES[item.type]}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
        {TYPE_LABEL[item.type]}
      </span>
      {item.text}
    </span>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="shrink-0 transition hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function AnnouncementsTicker({ items }: { items: PlatformAnnouncement[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length < 2) return;

    let frame = 0;
    let pos = el.scrollLeft;

    const tick = () => {
      pos += 0.4;
      const loopAt = el.scrollWidth / 2;
      if (loopAt > 0 && pos >= loopAt) pos = 0;
      el.scrollLeft = pos;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [items.length]);

  const doubled = [...items, ...items];

  return (
    <section aria-label="Оголошення платформи" className="overflow-hidden">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">📢</span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Оголошення
        </h2>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-hidden py-1"
        onMouseEnter={() => scrollRef.current && (scrollRef.current.style.scrollBehavior = "auto")}
      >
        {doubled.map((item, i) => (
          <AnnouncementItem key={`${item.id}-${i}`} item={item} />
        ))}
      </div>
    </section>
  );
}
