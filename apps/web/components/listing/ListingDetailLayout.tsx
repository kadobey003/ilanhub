interface Props {
  main: React.ReactNode;
  sidebar: React.ReactNode;
}

export function ListingDetailLayout({ main, sidebar }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0">{main}</div>
        <div className="lg:sticky lg:top-24">{sidebar}</div>
      </div>
    </div>
  );
}
