import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { api, type ListingDetail, type ListingRow, type ModerationLogEntry } from "../api/client";

const PRIMARY_STATUS = "pending_moderation";
const ALL_STATUSES = "";

const STATUS_OPTIONS = [
  { value: "pending_moderation", label: "На модерації", primary: true },
  { value: "pending_payment", label: "Оплата", primary: true },
  { value: "approved", label: "Схвалено", primary: false },
  { value: "published", label: "Опубліковано", primary: false },
  { value: "rejected", label: "Відхилено", primary: false },
  { value: "expired", label: "Скасовано", primary: false },
] as const;

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label]),
) as Record<string, string>;

const STATUS_LABELS_EXTRA: Record<string, string> = {
  ...STATUS_LABELS,
  draft: "Чернетка",
  pending_payment: "Оплата",
  publishing: "Публікація",
};

const CHANNEL_LABELS: Record<string, string> = {
  telegram: "Telegram",
  viber: "Viber",
  whatsapp: "WhatsApp",
  web: "Веб",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function moderationChips(moderation?: ListingRow["moderation"]) {
  if (!moderation) return [];
  const chips: string[] = [];
  if (moderation.paymentConfirmedBy) {
    chips.push(`💳 ${moderation.paymentConfirmedBy}`);
  }
  if (moderation.approvedBy) {
    chips.push(`✓ ${moderation.approvedBy}`);
  }
  if (moderation.rejectedBy) {
    chips.push(`✕ ${moderation.rejectedBy}`);
  }
  if (moderation.cancelledBy) {
    chips.push(`🚫 ${moderation.cancelledBy}`);
  }
  if (moderation.republishedBy) {
    chips.push(`📣 ${moderation.republishedBy}`);
  }
  return chips;
}

function ModerationHistory({ logs }: { logs?: ModerationLogEntry[] }) {
  if (!logs?.length) return null;
  return (
    <div className="mod-history">
      <div className="mod-history-title">Історія дій</div>
      <ul className="mod-timeline">
        {logs.map((log) => (
          <li key={log.id} className="mod-timeline-item">
            <span className={`mod-timeline-dot mod-timeline-${log.action}`} />
            <div className="mod-timeline-body">
              <div>
                <span className="mod-timeline-action">{log.actionLabel}</span>
                <span className="mod-timeline-date">{fmtTime(log.createdAt)}</span>
              </div>
              <div className="mod-timeline-note">
                <strong>{log.moderatorName}</strong>
                {log.note ? ` — ${log.note}` : ""}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmtPrice(price?: number, currency?: string) {
  if (!price) return null;
  return `${price.toLocaleString("uk-UA")} ${currency ?? "UAH"}`;
}

export function Listings() {
  const { manager } = useAuth();
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [status, setStatus] = useState(PRIMARY_STATUS);
  const [projectFilter, setProjectFilter] = useState("");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const managerProjects = manager?.projects ?? [];

  if (manager && manager.role !== "super_admin" && managerProjects.length === 0) {
    return (
      <div className="page mod-queue-page">
        <div className="mod-queue-empty mod-queue-empty-detail">
          <p>Вам не призначено проєктів</p>
          <span className="mod-empty-hint">Зверніться до super admin</span>
        </div>
      </div>
    );
  }

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .listings(status || undefined)
      .then((r) => setRows(r.data))
      .catch((e) => setError(String(e).replace("Error: ", "")))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (status !== PRIMARY_STATUS) return;
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, [status, load]);

  useEffect(() => {
    setSelectedId(null);
    setDetail(null);
    setNote("");
    setSuccess("");
  }, [status, projectFilter]);

  const filtered = useMemo(() => {
    let list = rows;
    if (projectFilter) {
      list = list.filter((r) => r.projectId === projectFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.title?.toLowerCase().includes(q) ?? false) ||
        r.project.toLowerCase().includes(q) ||
        (r.userName?.toLowerCase().includes(q) ?? false) ||
        (r.city?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, search, projectFilter]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
    setNote("");
  }, []);

  const selectListing = useCallback(async (row: ListingRow) => {
    setSelectedId(row.id);
    setNote("");
    setSuccess("");
    setError("");
    setDetailLoading(true);
    try {
      const res = await api.listing(row.id);
      setDetail(res.data);
    } catch (e) {
      setDetail(null);
      setError(String(e).replace("Error: ", ""));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (filtered.length === 0) {
      clearSelection();
      return;
    }
    if (!selectedId || !filtered.some((r) => r.id === selectedId)) {
      void selectListing(filtered[0]);
    }
  }, [filtered, loading, selectedId, selectListing, clearSelection]);

  const advanceQueue = (currentId: string, freshRows?: ListingRow[]) => {
    const list = freshRows ?? filtered;
    const idx = list.findIndex((r) => r.id === currentId);
    const next = list[idx + 1] ?? list[idx - 1] ?? null;
    if (next) void selectListing(next);
    else clearSelection();
  };

  const act = async (
    id: string,
    action: "approve" | "reject" | "cancel" | "confirm_payment" | "republish",
  ) => {
    if (action === "reject" && !note.trim() && !window.confirm("Відхилити без примітки?")) {
      return;
    }
    if (action === "cancel" && !window.confirm("Скасувати це оголошення?")) return;

    setActing(true);
    setError("");
    setSuccess("");
    try {
      if (action === "confirm_payment") {
        await api.updateListing(id, { status: "pending_moderation" });
        setSuccess("Оплату підтверджено");
      } else if (action === "republish") {
        await api.republishListing(id);
        setSuccess("У черзі на публікацію");
      } else {
        const fn =
          action === "approve"
            ? api.approveListing
            : action === "reject"
              ? api.rejectListing
              : api.cancelListing;
        await fn(id, note || undefined);
        setSuccess(
          action === "approve" ? "Схвалено ✓" : action === "reject" ? "Відхилено" : "Скасовано",
        );
      }
      setNote("");
      const res = await api.listings(status || undefined);
      setRows(res.data);
      let nextList = res.data;
      if (projectFilter) nextList = nextList.filter((r) => r.projectId === projectFilter);
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        nextList = nextList.filter(
          (r) =>
            (r.title?.toLowerCase().includes(q) ?? false) ||
            r.project.toLowerCase().includes(q) ||
            (r.userName?.toLowerCase().includes(q) ?? false),
        );
      }
      advanceQueue(id, nextList);
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setActing(false);
    }
  };

  const selected = filtered.find((r) => r.id === selectedId) ?? null;
  const price = fmtPrice(detail?.price ?? selected?.price, detail?.currency ?? selected?.currency);
  const listingStatus = detail?.status ?? selected?.status;
  const canModerate = listingStatus === PRIMARY_STATUS;
  const canPay = listingStatus === "pending_payment";

  const projectSubtitle =
    manager?.role === "super_admin"
      ? "Усі проєкти"
      : managerProjects.length
        ? managerProjects.map((p) => p.name).join(" · ")
        : "Проєкти не призначені";

  return (
    <div className={`page mod-queue-page${selectedId ? " mod-queue-has-selection" : ""}`}>
      <header className="mod-queue-hero">
        <div className="mod-queue-hero-main">
          <div className="mod-queue-count-wrap">
            <span className="mod-queue-count">{loading ? "…" : filtered.length}</span>
          </div>
          <div>
            <h1 className="mod-queue-title">Модерація</h1>
            <p className="mod-queue-sub">{projectSubtitle}</p>
          </div>
        </div>
        <button type="button" className="btn btn-outline mod-queue-refresh" onClick={load} disabled={loading}>
          {loading ? "…" : "↻ Оновити"}
        </button>
      </header>

      <div className="mod-queue-toolbar">
        <div className="mod-queue-status">
          <button
            type="button"
            className={`mod-queue-pill${status === ALL_STATUSES ? " active" : ""}`}
            onClick={() => setStatus(ALL_STATUSES)}
          >
            Усі
          </button>
          {STATUS_OPTIONS.filter((s) => s.primary).map((s) => (
            <button
              key={s.value}
              type="button"
              className={`mod-queue-pill${status === s.value ? " active" : ""}`}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </button>
          ))}
          <select
            className="input mod-queue-more"
            value={STATUS_OPTIONS.some((s) => !s.primary && s.value === status) ? status : ""}
            onChange={(e) => e.target.value && setStatus(e.target.value)}
          >
            <option value="" disabled>Інші статуси</option>
            {STATUS_OPTIONS.filter((s) => !s.primary).map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {managerProjects.length > 1 && (
          <div className="mod-queue-projects">
            <button
              type="button"
              className={`mod-queue-project${!projectFilter ? " active" : ""}`}
              onClick={() => setProjectFilter("")}
            >
              Всі проєкти
            </button>
            {managerProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`mod-queue-project${projectFilter === p.id ? " active" : ""}`}
                onClick={() => setProjectFilter(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <input
          className="input mod-queue-search"
          placeholder="Пошук…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="mod-alert mod-alert-error">{error}</div>}
      {success && <div className="mod-alert mod-alert-success">{success}</div>}

      <div className="mod-queue-body">
        <aside className="mod-queue-list">
          {loading && filtered.length === 0 ? (
            <div className="mod-queue-empty"><div className="mod-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="mod-queue-empty">
              <span className="mod-queue-empty-icon">{status === PRIMARY_STATUS ? "✓" : "—"}</span>
              <p>{status === PRIMARY_STATUS ? "Черга порожня" : "Немає оголошень"}</p>
            </div>
          ) : (
            filtered.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className={`mod-queue-card${selectedId === r.id ? " active" : ""}`}
                onClick={() => selectListing(r)}
              >
                <span className="mod-queue-num">{i + 1}</span>
                <div className="mod-queue-card-body">
                  <span className="mod-queue-card-title">{r.title || "Без назви"}</span>
                  <span className="mod-queue-card-meta">
                    {status === ALL_STATUSES && (
                      <span className="mod-queue-chip muted">{STATUS_LABELS_EXTRA[r.status] ?? r.status}</span>
                    )}
                    <span className="mod-queue-chip">{r.project}</span>
                    {r.city && <span>{r.city}</span>}
                    <span>{CHANNEL_LABELS[r.sourceChannel] ?? r.sourceChannel}</span>
                    <span>{fmtTime(r.createdAt)}</span>
                    {moderationChips(r.moderation).map((chip) => (
                      <span key={chip} className="mod-queue-chip muted">{chip}</span>
                    ))}
                  </span>
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="mod-queue-detail">
          {!selected ? (
            <div className="mod-queue-empty mod-queue-empty-detail">
              <p>Оберіть оголошення</p>
            </div>
          ) : detailLoading ? (
            <div className="mod-queue-empty"><div className="mod-spinner" /></div>
          ) : (
            <>
              <button type="button" className="mod-back-btn" onClick={clearSelection}>
                ← До списку
              </button>

              <div className="mod-queue-detail-head">
                <h2 className="mod-queue-detail-title">{detail?.title ?? selected.title}</h2>
                {price && <div className="mod-queue-price">{price}</div>}
              </div>

              <div className="mod-queue-tags">
                <span className="mod-queue-chip lg">{selected.project}</span>
                {selected.city && <span className="mod-queue-chip">{selected.city}</span>}
                <span className="mod-queue-chip">{CHANNEL_LABELS[selected.sourceChannel] ?? selected.sourceChannel}</span>
                <span className="mod-queue-chip muted">{fmtTime(selected.createdAt)}</span>
              </div>

              {detail?.media && detail.media.length > 0 && (
                <div className="mod-queue-gallery">
                  {detail.media.map((m) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer">
                      <img src={m.url} alt="" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}

              {(detail?.description ?? selected.description) && (
                <div className="mod-queue-desc">
                  {detail?.description ?? selected.description}
                </div>
              )}

              <div className="mod-queue-facts">
                <div><span>Категорія</span><strong>{selected.category ?? "—"}</strong></div>
                <div><span>Автор</span><strong>{selected.userName ?? "—"}</strong></div>
                <div><span>Телефон</span><strong>{detail?.contactPhone ?? detail?.userPhone ?? selected.contactPhone ?? selected.userPhone ?? "—"}</strong></div>
              </div>

              <textarea
                className="input mod-queue-note"
                placeholder="Примітка (для відхилення)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />

              <div className="mod-queue-actions">
                {canPay && (
                  <button type="button" className="mod-action-btn pay" disabled={acting} onClick={() => act(selected.id, "confirm_payment")}>
                    Оплату підтвердити
                  </button>
                )}
                {canModerate && (
                  <>
                    <button type="button" className="mod-action-btn approve" disabled={acting} onClick={() => act(selected.id, "approve")}>
                      ✓ Схвалити
                    </button>
                    <button type="button" className="mod-action-btn reject" disabled={acting} onClick={() => act(selected.id, "reject")}>
                      ✕ Відхилити
                    </button>
                  </>
                )}
                {listingStatus === "approved" && (
                  <button type="button" className="mod-action-btn publish" disabled={acting} onClick={() => act(selected.id, "republish")}>
                    Опублікувати
                  </button>
                )}
                <button type="button" className="mod-action-btn ghost" disabled={acting} onClick={() => act(selected.id, "cancel")}>
                  Скасувати
                </button>
              </div>

              <ModerationHistory logs={detail?.moderationLogs} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
