const icons = ["⚡", "📱", "🔒", "🌍", "✅", "💬"] as const;

function FeatureCard({
  item,
  icon,
  className = "",
}: {
  item: { title: string; description: string };
  icon: string;
  className?: string;
}) {
  return (
    <div
      className={`group rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm transition active:scale-[0.98] md:p-6 md:hover:border-brand/20 md:hover:shadow-md md:hover:shadow-brand/5 ${className}`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-indigo-100 text-xl md:h-12 md:w-12 md:text-2xl md:transition md:group-hover:scale-110">
        {icon}
      </span>
      <h3 className="mt-3 text-base font-semibold text-slate-900 md:mt-4 md:text-lg">
        {item.title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 md:mt-2 md:text-base">
        {item.description}
      </p>
    </div>
  );
}

export function FeatureGrid({
  title,
  items,
}: {
  title: string;
  items: { title: string; description: string }[];
}) {
  return (
    <section className="py-10 sm:py-20">
      <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-xs text-slate-500 sm:text-base">
        Все в одному додатку — швидко та зручно
      </p>

      <div className="-mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x-mandatory md:hidden">
        {items.map((item, i) => (
          <FeatureCard
            key={item.title}
            item={item}
            icon={icons[i % icons.length]}
            className="w-[72vw] max-w-[280px] shrink-0 snap-start"
          />
        ))}
      </div>

      <div className="mt-12 hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <FeatureCard key={item.title} item={item} icon={icons[i % icons.length]} />
        ))}
      </div>
    </section>
  );
}
