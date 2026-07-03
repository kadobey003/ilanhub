import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/AuthForm";
import { AuthRedirect } from "@/components/AuthRedirect";

export const metadata: Metadata = { title: "Увійти" };

export default function Page() {
  return (
    <>
      <AuthRedirect />
      <LoginPage />
    </>
  );
}
