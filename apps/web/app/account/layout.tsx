import { AuthGate, AccountShell } from "@/components/account/AccountShell";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AccountShell>{children}</AccountShell>
    </AuthGate>
  );
}
