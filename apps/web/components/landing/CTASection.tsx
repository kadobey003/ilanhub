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
    <section className="rounded-3xl bg-slate-900 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-lg text-slate-400">{subtitle}</p>
      <div className="mt-8">
        <Button href={href} size="lg" className="!bg-amber-400 !text-slate-900 hover:!bg-amber-300">
          {cta}
        </Button>
      </div>
    </section>
  );
}
