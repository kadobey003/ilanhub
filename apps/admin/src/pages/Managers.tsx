import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type ManagerRow,
  type ManagerSummary,
  type ProjectRow,
} from "../api/client";
import { FormPanel } from "../components/ui";
import { IconKey, IconListings, IconUsers } from "../components/icons";
import { useAuth } from "../auth";

type Period = "7d" | "30d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 днів",
  "30d": "30 днів",
  all: "Весь час",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function roleLabel(role: ManagerRow["role"]) {
  return role === "super_admin" ? "Super Admin" : "Менеджер";
}

function PerformanceBar({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "green" | "red" | "amber" | "blue";
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mgr-bar">
      <div className={`mgr-bar-fill mgr-bar-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Managers() {
  const { manager: current } = useAuth();
  const [rows, setRows] = useState<ManagerRow[]>([]);
  const [summary, setSummary] = useState<ManagerSummary | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "manager" as "manager" | "super_admin",
    projectIds: [] as string[],
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.managers(period),
      api.projects(),
    ])
      .then(([mgrRes, projRes]) => {
        setRows(mgrRes.data);
        setSummary(mgrRes.summary);
        setProjects(projRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.projects.some((p) => p.name.toLowerCase().includes(q)),
        )
      : [...rows];
    return list.sort(
      (a, b) => b.stats.totalModerated - a.stats.totalModerated,
    );
  }, [rows, search]);

  const maxModerated = useMemo(
    () => Math.max(1, ...filtered.map((r) => r.stats.totalModerated)),
    [filtered],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createManager({
      email: form.email,
      password: form.password,
      name: form.name,
      role: form.role,
      projectIds: form.projectIds.length ? form.projectIds : undefined,
    });
    setShowForm(false);
    setForm({ email: "", password: "", name: "", role: "manager", projectIds: [] });
    load();
  };

  const toggleActive = async (row: ManagerRow) => {
    if (row.id === current?.id) return;
    await api.updateManager(row.id, { isActive: !row.isActive });
    load();
  };

  const remove = async (id: string) => {
    if (id === current?.id) return;
    if (!confirm("Видалити менеджера?")) return;
    await api.deleteManager(id);
    load();
  };

  const toggleProject = (pid: string) => {
    setForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(pid)
        ? f.projectIds.filter((x) => x !== pid)
        : [...f.projectIds, pid],
    }));
  };

  if (current?.role !== "super_admin") {
    return <p className="empty">Доступ лише для super admin</p>;
  }

  return (
    <div className="page mgr-page">
      <header className="mod-header">
        <div>
          <h2 className="page-title mod-title">Менеджери</h2>
          <p className="mod-subtitle">
            Команда, доступи та ефективність модерації
          </p>
        </div>
        <div className="mgr-header-actions">
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            {loading ? "…" : "Оновити"}
          </button>
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Скасувати" : "+ Додати"}
          </button>
        </div>
      </header>

      <div className="stats-grid mgr-stats">
        <div className="stat-card stat-card-blue">
          <div className="stat-card-icon"><IconUsers size={22} /></div>
          <div className="stat-card-body">
            <span className="stat-value">
              {(summary?.totalManagers ?? rows.length).toLocaleString("uk-UA")}
            </span>
            <span className="stat-label">Менеджерів</span>
          </div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-card-icon"><IconKey size={22} /></div>
          <div className="stat-card-body">
            <span className="stat-value">
              {(summary?.activeManagers ?? 0).toLocaleString("uk-UA")}
            </span>
            <span className="stat-label">Активних</span>
          </div>
        </div>
        <div className="stat-card stat-card-violet">
          <div className="stat-card-icon"><IconListings size={22} /></div>
          <div className="stat-card-body">
            <span className="stat-value">
              {(summary?.totalModerated ?? 0).toLocaleString("uk-UA")}
            </span>
            <span className="stat-label">Модерацій</span>
          </div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-card-icon">%</div>
          <div className="stat-card-body">
            <span className="stat-value">
              {summary?.avgApprovalRate != null
                ? `${summary.avgApprovalRate}%`
                : "—"}
            </span>
            <span className="stat-label">Середнє схвалення</span>
          </div>
        </div>
      </div>

      <div className="mod-tabs mgr-tabs">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            className={`mod-tab${period === p ? " mod-tab-active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mod-toolbar">
        <div className="mod-search-wrap">
          <span className="mod-search-icon" aria-hidden>⌕</span>
          <input
            className="input mod-search"
            placeholder="Пошук за ім'ям, email або проєктом…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showForm && (
        <FormPanel title="Новий менеджер" onSubmit={submit}>
          <input className="input" placeholder="Ім'я" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Пароль (мін. 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "manager" | "super_admin" })}>
            <option value="manager">Менеджер</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <div className="project-checks">
            <span className="label-sm">Проєкти:</span>
            {projects.map((p) => (
              <label key={p.id} className="check-label">
                <input type="checkbox" checked={form.projectIds.includes(p.id)} onChange={() => toggleProject(p.id)} />
                {p.name}
              </label>
            ))}
          </div>
          <button className="btn" type="submit">Зберегти</button>
        </FormPanel>
      )}

      {filtered.length === 0 ? (
        <div className="mgr-empty">
          <span className="mgr-empty-icon">👥</span>
          <p>{loading ? "Завантаження…" : "Немає менеджерів"}</p>
        </div>
      ) : (
        <div className="mgr-grid">
          {filtered.map((r) => {
            const isSelf = r.id === current?.id;
            const rate = r.stats.approvalRate;
            return (
              <article
                key={r.id}
                className={`mgr-card${!r.isActive ? " mgr-card-inactive" : ""}`}
              >
                <div className="mgr-card-head">
                  <span className="mgr-avatar">{initials(r.name)}</span>
                  <div className="mgr-card-meta">
                    <h3 className="mgr-card-name">{r.name}</h3>
                    <p className="mgr-card-email">{r.email}</p>
                  </div>
                  <span className={`mgr-role mgr-role-${r.role}`}>
                    {roleLabel(r.role)}
                  </span>
                </div>

                <div className="mgr-card-tags">
                  <span className={`mgr-status${r.isActive ? " mgr-status-active" : ""}`}>
                    {r.isActive ? "Активний" : "Неактивний"}
                  </span>
                  {r.projects.length ? (
                    r.projects.map((p) => (
                      <span key={p.id} className="mgr-project-chip">{p.name}</span>
                    ))
                  ) : (
                    <span className="mgr-project-chip mgr-project-chip-muted">Усі проєкти</span>
                  )}
                </div>

                <div className="mgr-metrics">
                  <div className="mgr-metric">
                    <div className="mgr-metric-top">
                      <span>Схвалено</span>
                      <strong>{r.stats.approved}</strong>
                    </div>
                    <PerformanceBar value={r.stats.approved} max={maxModerated} tone="green" />
                  </div>
                  <div className="mgr-metric">
                    <div className="mgr-metric-top">
                      <span>Відхилено</span>
                      <strong>{r.stats.rejected}</strong>
                    </div>
                    <PerformanceBar value={r.stats.rejected} max={maxModerated} tone="red" />
                  </div>
                  <div className="mgr-metric-row">
                    <div className="mgr-metric-inline">
                      <span>Модерацій</span>
                      <strong>{r.stats.totalModerated}</strong>
                    </div>
                    <div className="mgr-metric-inline">
                      <span>Видалень</span>
                      <strong>{r.stats.removedPublications}</strong>
                    </div>
                    <div className="mgr-metric-inline">
                      <span>Схвалення</span>
                      <strong className={rate != null && rate >= 70 ? "mgr-rate-good" : rate != null && rate < 50 ? "mgr-rate-low" : ""}>
                        {rate != null ? `${rate}%` : "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mgr-card-foot">
                  <span className="mgr-last">
                    Остання дія: {fmtDate(r.stats.lastActivity)}
                  </span>
                  <div className="mgr-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => toggleActive(r)}
                      disabled={isSelf}
                    >
                      {r.isActive ? "Деактивувати" : "Активувати"}
                    </button>
                    {!isSelf && (
                      <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>
                        Видалити
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
