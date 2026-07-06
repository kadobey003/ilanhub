import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";
import { AuthGate, AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Кабінет",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AccountShell>{children}</AccountShell>
    </AuthGate>
  );
}
