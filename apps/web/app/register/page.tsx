import type { Metadata } from "next";
import { RegisterPage } from "@/components/auth/AuthForm";
import { AuthRedirect } from "@/components/AuthRedirect";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = { ...NOINDEX_METADATA, title: "Реєстрація" };

export default function Page() {
  return (
    <>
      <AuthRedirect />
      <RegisterPage />
    </>
  );
}
