"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { InstallBanner } from "@/components/InstallBanner";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAccount = pathname.startsWith("/account");

  if (isAccount) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1 pb-nav md:pb-0">{children}</main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileNav />
      <InstallBanner />
    </>
  );
}
