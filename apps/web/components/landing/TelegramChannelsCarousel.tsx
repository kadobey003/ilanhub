"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function TelegramChannelsCarousel({
  children,
  marquee,
}: {
  children: ReactNode;
  marquee: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const items = Children.toArray(children);

  useEffect(() => {
    if (!marquee) return;
    const el = scrollRef.current;
    if (!el) return;

    let frame = 0;
    let pos = el.scrollLeft;

    const tick = () => {
      if (!paused) {
        pos += 0.6;
        const loopAt = el.scrollWidth / 2;
        if (loopAt > 0 && pos >= loopAt) pos = 0;
        el.scrollLeft = pos;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [marquee, paused]);

  if (!marquee) {
    return (
      <div className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    );
  }

  const duplicated = items.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, { key: `${String(child.key)}-dup-${i}` })
      : child,
  );

  return (
    <div
      className="relative mt-6 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden pb-2 scrollbar-hide"
      >
        {items}
        {duplicated}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#1a8bc4] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0d5f8a] to-transparent" />
    </div>
  );
}
