export interface VipBadgeProps {
  label?: string;
  size?: "sm" | "md";
}

export function VipBadge({ label = "VIP", size = "sm" }: VipBadgeProps) {
  const fontSize = size === "sm" ? "11px" : "13px";
  const padding = size === "sm" ? "2px 6px" : "4px 10px";

  return (
    <span
      className="vip-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize,
        fontWeight: 700,
        color: "#b45309",
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        border: "1px solid #fbbf24",
        padding,
        borderRadius: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      ★ {label}
    </span>
  );
}
