import {
  buildHorecaPostSections,
  parseStoredPosition,
} from "@ilanhub/shared";
import { TrackablePhoneLink } from "@/components/TrackablePhoneLink";
import type { PublicListingDetail } from "@/lib/listings-types";

interface Props {
  listing: PublicListingDetail;
}

export function HorecaPostBody({ listing }: Props) {
  const positions = listing.positions.map(parseStoredPosition);
  const sections = buildHorecaPostSections({
    businessType: listing.businessType,
    title: listing.title ?? "Заклад",
    address: listing.address,
    city: listing.city?.name,
    district: listing.district?.name,
    contactPhone: listing.contactPhone,
    benefits: listing.description,
    positions,
  });

  const phoneHref = listing.contactPhone
    ? `tel:${listing.contactPhone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-slate-800 sm:text-base">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {sections.venue}
        </h1>
        {sections.address && (
          <p className="text-slate-600">{sections.address}</p>
        )}
        <p className="pt-1 font-medium text-slate-900">{sections.intro}</p>
      </header>

      <div className="space-y-5">
        {sections.vacancies.map((vacancy) => (
          <section
            key={vacancy.title}
            className="rounded-xl border border-amber-100/80 bg-amber-50/40 p-4"
          >
            <h2 className="font-bold text-slate-900">• {vacancy.title}</h2>
            <ul className="mt-2 space-y-1 text-slate-700">
              {vacancy.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {sections.benefits.length > 0 && (
        <ul className="space-y-1.5 text-slate-700">
          {sections.benefits.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-amber-600">−</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {sections.contact && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">{sections.contact.label}</p>
          {phoneHref ? (
            <TrackablePhoneLink
              href={phoneHref}
              listingId={listing.id}
              projectId={listing.projectId}
              className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-amber-700 hover:text-amber-800"
            >
              {sections.contact.phone}
            </TrackablePhoneLink>
          ) : (
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {sections.contact.phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
