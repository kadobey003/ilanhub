"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics-api";

interface Props {
  listingId: string;
  projectId: string;
}

export function ListingAnalytics({ listingId, projectId }: Props) {
  useEffect(() => {
    trackAnalyticsEvent({ eventType: "view", projectId, listingId });
  }, [listingId, projectId]);

  return null;
}
