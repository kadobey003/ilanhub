"use client";

import type { ReactNode } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics-api";

interface Props {
  href: string;
  listingId: string;
  projectId: string;
  className?: string;
  children: ReactNode;
}

export function TrackablePhoneLink({
  href,
  listingId,
  projectId,
  className,
  children,
}: Props) {
  return (
    <a
      href={href}
      className={className}
      onClick={() =>
        trackAnalyticsEvent({
          eventType: "click",
          projectId,
          listingId,
          metadata: { target: "phone" },
        })
      }
    >
      {children}
    </a>
  );
}
