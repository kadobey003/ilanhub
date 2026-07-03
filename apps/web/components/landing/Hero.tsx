import { Button } from "@/components/ui/Button";

export function Hero({
  badge,
  title,
  highlight,
  subtitle,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
  gradient = "from-brand via-blue-600 to-indigo-700",
}: {
  badge?: string;
  title: string;
  highlight?: string;
  subtitle: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  gradient?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} px-6 py-16 sm:px-12 sm:py-24 text-white`}
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

      <div className="relative max-w-3xl">
        {badge && (
          <span className="mb-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            {badge}
          </span>
        )}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {title}
          {highlight && (
            <span className="block text-amber-300">{highlight}</span>
          )}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-blue-100 sm:text-xl leading-relaxed">
          {subtitle}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            href={primaryHref}
            variant="secondary"
            size="lg"
            className="!bg-white !text-slate-900 hover:!bg-blue-50"
          >
            {primaryCta}
          </Button>
          {secondaryCta && secondaryHref && (
            <Button
              href={secondaryHref}
              variant="ghost"
              size="lg"
              className="!text-white border border-white/30 hover:!bg-white/10"
            >
              {secondaryCta}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
