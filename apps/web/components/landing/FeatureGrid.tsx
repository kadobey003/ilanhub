const icons = ["⚡", "📱", "🔒", "🌍", "✅", "💬"] as const;

export function FeatureGrid({
  title,
  items,
}: {
  title: string;
  items: { title: string; description: string }[];
}) {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={item.title}
            className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-brand/20 hover:shadow-md hover:shadow-brand/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-2xl transition group-hover:scale-110">
              {icons[i % icons.length]}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-2 text-slate-600 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
