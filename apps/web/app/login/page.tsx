import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/AuthForm";
import { AuthRedirect } from "@/components/AuthRedirect";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = { ...NOINDEX_METADATA, title: "Увійти" };

export default function Page() {
  return (
    <>
      <AuthRedirect />
      <LoginPage />
    </>
  );
}
