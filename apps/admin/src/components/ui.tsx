import type { CSSProperties, FormEvent, ReactNode } from "react";

/* ── Alerts ── */
export function Alert({ type, children }: { type: "error" | "success"; children: ReactNode }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

/* ── Empty ── */
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden>📭</span>
      <p>{message}</p>
      {hint && <span className="empty-state-hint">{hint}</span>}
    </div>
  );
}

/* ── Form panel ── */
export function FormPanel({
  title,
  children,
  onSubmit,
}: {
  title?: string;
  children: ReactNode;
  onSubmit?: (e: FormEvent) => void;
}) {
  const Tag = onSubmit ? "form" : "div";
  return (
    <Tag className="card form-panel" onSubmit={onSubmit}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="form-grid">{children}</div>
    </Tag>
  );
}

/* ── Filter bar ── */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

/* ── Selection bar ── */
export function SelectionBar({ count, children }: { count: number; children: ReactNode }) {
  return (
    <div className="selection-bar">
      <span className="selection-bar-label">Обрано: {count}</span>
      <div className="selection-bar-actions">{children}</div>
    </div>
  );
}

/* ── Data table wrapper ── */
export function DataTable({
  children,
  empty,
  isEmpty,
  minWidth = 560,
  cardMode = true,
}: {
  children: ReactNode;
  empty?: string;
  isEmpty?: boolean;
  minWidth?: number;
  cardMode?: boolean;
}) {
  if (isEmpty && empty) {
    return (
      <div className="card table-card">
        <EmptyState message={empty} />
      </div>
    );
  }

  return (
    <div className="card table-card">
      <div
        className={`table-scroll${cardMode ? " table-scroll-cards" : ""}`}
        style={{ "--table-min-w": `${minWidth}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Panel card ── */
export function PanelCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card panel-card ${className}`.trim()}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}

/* ── Modal ── */
export function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-head">
          <h3 className="card-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрити">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
