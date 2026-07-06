import { Button } from "@/components/ui/Button";

export function CTASection({
  title,
  subtitle,
  cta,
  href,
}: {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-5 py-10 text-center text-white sm:rounded-3xl sm:px-12 sm:py-16">
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative">
        <span className="mb-3 inline-block text-3xl">🚀</span>
        <h2 className="text-xl font-bold sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400 sm:text-base">{subtitle}</p>
        <div className="mt-6 sm:mt-8">
          <Button
            href={href}
            size="lg"
            className="w-full !rounded-2xl !bg-gradient-to-r !from-amber-400 !to-amber-300 !text-slate-900 hover:!from-amber-300 hover:!to-amber-200 sm:w-auto"
          >
            {cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
