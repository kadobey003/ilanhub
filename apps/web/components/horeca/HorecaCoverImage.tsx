import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";

interface Props {
  src?: string | null;
  title: string;
  className?: string;
  sizes?: "card" | "detail";
}

export function HorecaCoverImage({
  src,
  title,
  className = "",
  sizes = "detail",
}: Props) {
  const logoSize = sizes === "card" ? "h-12 w-12 sm:h-14 sm:w-14" : "h-16 w-16 sm:h-20 sm:w-20";
  const titleSize =
    sizes === "card"
      ? "text-lg sm:text-xl"
      : "text-2xl sm:text-3xl md:text-4xl";

  return (
    <div
      className={`relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-slate-800 to-slate-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />

      <div className={`absolute left-3 top-3 sm:left-4 sm:top-4 ${logoSize}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO_PATH}
          alt={BRAND_NAME}
          className="h-full w-full rounded-full object-cover drop-shadow-lg"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10 text-center">
        <p
          className={`font-serif font-bold uppercase tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] ${titleSize}`}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
