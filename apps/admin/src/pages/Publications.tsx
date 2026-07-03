import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { FilterBar, DataTable, EmptyState } from "../components/ui";
import { api, type PublicationRow } from "../api/client";

const STATUSES = [
  { value: "", label: "Всі" },
  { value: "pending", label: "Очікує" },
  { value: "published", label: "Опубліковано" },
  { value: "failed", label: "Помилка" },
  { value: "removed", label: "Знято" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  published: "Опубліковано",
  failed: "Помилка",
  removed: "Знято",
};

const CHANNEL_LABELS: Record<string, string> = {
  telegram: "Telegram",
  viber: "Viber",
  whatsapp: "WhatsApp",
  web: "Веб",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Publications() {
  const [rows, setRows] = useState<PublicationRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .publications(status || undefined)
      .then((r) => setRows(r.data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const act = async (id: string, action: "retry" | "remove" | "pin" | "feature" | "republish") => {
    if (action === "remove" && !confirm("Зняти публікацію з каналу? Оголошення залишиться.")) {
      return;
    }
    setActing(id);
    setError("");
    try {
      if (action === "retry") await api.retryPublication(id);
      else if (action === "remove") await api.removePublication(id);
      else if (action === "pin") await api.pinPublication(id);
      else if (action === "feature") await api.featurePublication(id);
      else await api.republishPublication(id);
      load();
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}

      <PageHeader
        title="Дистрибуція"
        subtitle="Публікації оголошень на каналах"
        actions={
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            {loading ? "..." : "Оновити"}
          </button>
        }
      />

      <FilterBar>
        <select className="input" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </FilterBar>

      {loading ? (
        <div className="card"><EmptyState message="Завантаження..." /></div>
      ) : (
        <DataTable empty="Немає публікацій" isEmpty={rows.length === 0} minWidth={960} cardMode={false}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Оголошення</th>
                <th>Проєкт</th>
                <th>Канал</th>
                <th>Схвалив</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const busy = acting === r.id;
                const isPublished = r.status === "published";
                const isRemoved = r.status === "removed";
                const isTelegram = r.channel === "telegram";

                return (
                  <tr key={r.id}>
                    <td data-label="Оголошення">
                      <div className="pub-title">{r.listingTitle ?? r.listingId.slice(0, 8)}</div>
                      {r.listingIsPinned && <span className="badge badge-pin">📌</span>}
                      {(r.listingBoostScore ?? 0) > 0 && (
                        <span className="badge badge-featured">⭐</span>
                      )}
                    </td>
                    <td data-label="Проєкт">{r.project}</td>
                    <td data-label="Канал">
                      <span className="badge">{CHANNEL_LABELS[r.channel] ?? r.channel}</span>
                    </td>
                    <td data-label="Схвалив">{r.approvedByName ?? "—"}</td>
                    <td data-label="Статус">
                      <span className={`badge badge-${r.status}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                      {r.errorMessage && (
                        <span className="error-sm" title={r.errorMessage}>
                          ⚠
                        </span>
                      )}
                      {isRemoved && r.removedByName && (
                        <div className="pub-meta">
                          Зняв: {r.removedByName}
                          {r.removedAt ? ` · ${fmtDate(r.removedAt)}` : ""}
                        </div>
                      )}
                    </td>
                    <td data-label="Дата">{fmtDate(r.publishedAt ?? r.createdAt)}</td>
                    <td data-label="Дії" className="actions pub-actions">
                      {r.status === "failed" && (
                        <button
                          className="btn btn-sm"
                          disabled={busy}
                          onClick={() => act(r.id, "retry")}
                        >
                          Повторити
                        </button>
                      )}
                      {isPublished && (
                        <>
                          {isTelegram && (
                            <button
                              className="btn btn-sm"
                              disabled={busy}
                              onClick={() => act(r.id, "pin")}
                            >
                              📌 Закріпити
                            </button>
                          )}
                          <button
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={() => act(r.id, "feature")}
                          >
                            ⭐ В топ
                          </button>
                          <button
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={() => act(r.id, "republish")}
                          >
                            🔄 Знову
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={busy}
                            onClick={() => act(r.id, "remove")}
                          >
                            Зняти
                          </button>
                        </>
                      )}
                      {!isPublished && !isRemoved && r.status !== "failed" && (
                        <span className="pub-meta">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTable>
      )}
    </div>
  );
}
