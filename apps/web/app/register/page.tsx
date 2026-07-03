import type { Metadata } from "next";
import { RegisterPage } from "@/components/auth/AuthForm";
import { AuthRedirect } from "@/components/AuthRedirect";

export const metadata: Metadata = { title: "Реєстрація" };

export default function Page() {
  return (
    <>
      <AuthRedirect />
      <RegisterPage />
    </>
  );
}
