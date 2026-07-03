import { useEffect, useState } from "react";
import { api, type AnalyticsData } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/ui";
import { IconCard, IconChart, IconListings, IconUsers } from "../components/icons";

const emptyData: AnalyticsData = {
  views: 0,
  clicks: 0,
  conversions: 0,
  payments: 0,
  revenue: 0,
  daily: [],
};

export function Analytics() {
  const [data, setData] = useState<AnalyticsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .analytics()
      .then(setData)
      .catch((err: Error) => {
        setData(emptyData);
        setError(err.message || "Не вдалося завантажити аналітику");
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { key: "views", label: "Перегляди", value: data.views, icon: IconChart, color: "blue" },
    { key: "clicks", label: "Кліки", value: data.clicks, icon: IconListings, color: "violet" },
    { key: "conversions", label: "Конверсії", value: data.conversions, icon: IconUsers, color: "green" },
    { key: "payments", label: "Платежі", value: data.payments, icon: IconCard, color: "amber" },
  ] as const;

  return (
    <div className="page">
      <PageHeader title="Аналітика" subtitle="Перегляди, кліки та конверсії за 30 днів" />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        {cards.map(({ key, label, value, icon: Icon, color }) => (
          <div key={key} className={`stat-card stat-card-${color}`}>
            <div className="stat-card-icon"><Icon size={22} /></div>
            <div className="stat-card-body">
              <span className="stat-value">
                {loading ? "…" : value.toLocaleString("uk-UA")}
              </span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {!loading && data.revenue > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <strong>{data.revenue.toLocaleString("uk-UA")} ₴</strong>
          <span style={{ color: "var(--text-muted, #64748b)" }}> — загальний дохід від платежів</span>
        </div>
      )}

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h3 className="card-title">Динаміка за 30 днів</h3>
        <DataTable
          empty="Ще немає подій аналітики"
          isEmpty={!loading && data.daily.length === 0}
          minWidth={520}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Перегляди</th>
                <th>Кліки</th>
                <th>Конверсії</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((row) => (
                <tr key={row.date}>
                  <td data-label="Дата">
                    {new Date(`${row.date}T12:00:00`).toLocaleDateString("uk-UA")}
                  </td>
                  <td data-label="Перегляди">{row.views.toLocaleString("uk-UA")}</td>
                  <td data-label="Кліки">{row.clicks.toLocaleString("uk-UA")}</td>
                  <td data-label="Конверсії">{row.conversions.toLocaleString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>
    </div>
  );
}
