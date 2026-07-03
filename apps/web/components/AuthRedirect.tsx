"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export function AuthRedirect({ to = "/account" }: { to?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) router.replace(to);
  }, [router, to]);

  return null;
}
