interface Props {
  address: string;
  city?: string | null;
}

export function ListingMap({ address, city }: Props) {
  const query = [address, city].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">📍 Розташування</h3>
        <p className="mt-0.5 text-sm text-slate-500">{query}</p>
      </div>
      <iframe
        title={`Карта: ${query}`}
        src={src}
        className="h-56 w-full border-0 sm:h-72"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  );
}
