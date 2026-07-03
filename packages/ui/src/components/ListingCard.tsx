export interface ListingCardProps {
  id: string;
  title: string;
  price?: number | null;
  currency?: string;
  city?: string;
  imageUrl?: string;
  isVip?: boolean;
  isPinned?: boolean;
  publishedAt?: string;
  onClick?: (id: string) => void;
}

function formatPrice(amount: number, currency = "UAH"): string {
  if (currency === "UAH" && amount <= 0) return "Безкоштовно";
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ListingCard({
  id,
  title,
  price,
  currency = "UAH",
  city,
  imageUrl,
  isVip = false,
  isPinned = false,
  publishedAt,
  onClick,
}: ListingCardProps) {
  return (
    <article
      className="listing-card"
      onClick={() => onClick?.(id)}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        background: "#fff",
      }}
    >
      {imageUrl && (
        <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
          <img
            src={imageUrl}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <div style={{ padding: "12px" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
          {isVip && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#b45309",
                background: "#fef3c7",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              VIP
            </span>
          )}
          {isPinned && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#1d4ed8",
                background: "#dbeafe",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              📌
            </span>
          )}
        </div>
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "15px",
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        {price != null && (
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#059669",
            }}
          >
            {formatPrice(price, currency)}
          </p>
        )}
        {city && (
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
            {city}
          </p>
        )}
        {publishedAt && (
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>
            {publishedAt}
          </p>
        )}
      </div>
    </article>
  );
}
