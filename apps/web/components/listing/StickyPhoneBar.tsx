"use client";

import { useEffect, useState } from "react";
import { TrackablePhoneLink } from "@/components/TrackablePhoneLink";

interface Props {
  phone: string;
  listingId: string;
  projectId: string;
  isHoreca?: boolean;
}

export function StickyPhoneBar({
  phone,
  listingId,
  projectId,
  isHoreca,
}: Props) {
  const [visible, setVisible] = useState(false);
  const href = `tel:${phone.replace(/[^\d+]/g, "")}`;

  useEffect(() => {
    const contact = document.getElementById("listing-contact");
    if (!contact) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(contact);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 md:hidden">
      <TrackablePhoneLink
        href={href}
        listingId={listingId}
        projectId={projectId}
        className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-bold text-white shadow-xl ${
          isHoreca
            ? "bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/30"
            : "bg-gradient-to-r from-blue-600 to-brand shadow-brand/30"
        }`}
      >
        <span aria-hidden>📲</span>
        Зателефонувати
      </TrackablePhoneLink>
    </div>
  );
}
