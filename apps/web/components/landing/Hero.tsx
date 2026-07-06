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
    <section className="relative overflow-hidden md:rounded-3xl app-gradient-hero text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.07]" />
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-float" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative px-5 py-10 sm:px-12 sm:py-20 md:py-24">
        <div className="max-w-3xl">
          {badge && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-sm sm:text-sm">
              {badge}
            </span>
          )}
          <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
            {highlight && (
              <span className="mt-1 block bg-gradient-to-r from-amber-200 to-yellow-300 bg-clip-text text-transparent">
                {highlight}
              </span>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/90 sm:mt-6 sm:text-xl">
            {subtitle}
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:items-center sm:gap-3">
            <Button
              href={primaryHref}
              variant="secondary"
              size="lg"
              className="w-full !rounded-2xl !bg-white !text-slate-900 hover:!bg-blue-50 sm:w-auto"
            >
              {primaryCta}
            </Button>
            {secondaryCta && secondaryHref && (
              <Button
                href={secondaryHref}
                variant="ghost"
                size="lg"
                className="w-full !rounded-2xl !text-white border border-white/25 hover:!bg-white/10 sm:w-auto"
              >
                {secondaryCta}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3 overflow-x-auto scrollbar-hide sm:hidden">
          {[
            { icon: "💼", label: "Робота" },
            { icon: "🍽️", label: "Horeca" },
            { icon: "🚗", label: "Авто" },
            { icon: "📱", label: "Боти" },
          ].map((chip) => (
            <span
              key={chip.label}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm"
            >
              <span>{chip.icon}</span>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
