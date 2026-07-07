import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Alert, FormPanel, PanelCard } from "../components/ui";
import {
  IconCard,
  IconChannel,
  IconChart,
  IconListings,
  IconTelegram,
} from "../components/icons";
import {
  api,
  type ChannelRow,
  type ChannelSummary,
  type CityRow,
  type ProjectRow,
} from "../api/client";

const CHANNEL_TYPES = [
  { value: "telegram", label: "Telegram", color: "#229ED9" },
  { value: "viber", label: "Viber", color: "#7360F2" },
  { value: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { value: "instagram", label: "Instagram", color: "#E4405F" },
  { value: "web", label: "Web", color: "#6366f1" },
];

const CONFIG_FIELDS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  telegram: [{ key: "channelId", label: "Channel ID (@username або -100...)" }],
  viber: [
    { key: "authToken", label: "Auth Token", secret: true },
    { key: "senderName", label: "Sender Name" },
    { key: "communityUri", label: "Community URI / URL" },
    { key: "url", label: "Public URL (опційно)" },
  ],
  whatsapp: [
    { key: "token", label: "Access Token", secret: true },
    { key: "phoneNumberId", label: "Phone Number ID" },
    { key: "phone", label: "Phone (wa.me)" },
    { key: "url", label: "Community URL (опційно)" },
  ],
  instagram: [
    { key: "username", label: "Username (@profile)" },
    { key: "url", label: "Profile URL (опційно)" },
    { key: "pageId", label: "Page ID" },
    { key: "accessToken", label: "Access Token", secret: true },
  ],
  web: [{ key: "baseUrl", label: "Base URL" }],
};

const EMPTY_SUMMARY: ChannelSummary = {
  totalChannels: 0,
  activeChannels: 0,
  publicationsToday: 0,
  publicationsMonth: 0,
  revenueToday: 0,
  revenueMonth: 0,
  revenueTotal: 0,
};

const EMPTY_FORM = {
  projectId: "",
  channel: "telegram",
  name: "",
  isActive: true,
  isGlobal: false,
  cityIds: [] as string[],
  config: {} as Record<string, string>,
};

function fmtMoney(n: number) {
  return `${n.toLocaleString("uk-UA")} ₴`;
}

function channelMeta(type: string) {
  return CHANNEL_TYPES.find((c) => c.value === type) ?? CHANNEL_TYPES[0];
}

function MiniTrend({ daily, field }: { daily: { date: string; publications: number; revenue: number }[]; field: "publications" | "revenue" }) {
  if (!daily.length) return <div className="ch-trend ch-trend-empty">Немає даних</div>;
  const max = Math.max(...daily.map((d) => d[field]), 1);
  return (
    <div className="ch-trend" aria-hidden>
      {daily.map((d) => (
        <span
          key={d.date}
          className="ch-trend-bar"
          style={{ height: `${Math.max(8, (d[field] / max) * 100)}%` }}
          title={`${d.date}: ${field === "revenue" ? fmtMoney(d.revenue) : d.publications}`}
        />
      ))}
    </div>
  );
}

export function Channels() {
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [summary, setSummary] = useState<ChannelSummary>(EMPTY_SUMMARY);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [selected, setSelected] = useState<ChannelRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    api.channels().then((r) => {
      setRows(r.data);
      setSummary(r.summary ?? EMPTY_SUMMARY);
    }).catch(() => {});
    api.projects().then((r) => setProjects(r.data)).catch(() => {});
    api.cities().then((r) => setCities(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const fields = CONFIG_FIELDS[form.channel] ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (projectFilter && r.projectId !== projectFilter) return false;
      if (typeFilter && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        (r.name ?? "").toLowerCase().includes(q) ||
        r.project.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    });
  }, [rows, projectFilter, typeFilter, search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createChannel({
        projectId: form.projectId,
        channel: form.channel,
        name: form.name || undefined,
        isActive: form.isActive,
        isGlobal: form.isGlobal,
        cityIds: form.isGlobal ? [] : form.cityIds,
        config: form.config,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } finally {
      setSaving(false);
    }
  };

  const saveSelected = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      await api.updateChannel(selected.id, {
        name: selected.name?.trim() || undefined,
        config: selected.config as Record<string, unknown>,
        isActive: selected.isActive,
        isGlobal: selected.isGlobal,
        cityIds: selected.isGlobal ? [] : selected.cities.map((c) => c.id),
      });
      const updated = await api.channels();
      setRows(updated.data);
      setSummary(updated.summary ?? EMPTY_SUMMARY);
      setSelected(updated.data.find((r) => r.id === selected.id) ?? null);
      setMsg("Збережено");
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Видалити канал?")) return;
    await api.deleteChannel(id);
    setSelected(null);
    load();
  };

  const setConfig = (key: string, value: string) => {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  };

  const setSelectedConfig = (key: string, value: string) => {
    if (!selected) return;
    setSelected({ ...selected, config: { ...selected.config, [key]: value } });
  };

  const toggleCity = (cityId: string, checked: boolean) => {
    setForm((f) => ({
      ...f,
      cityIds: checked ? [...f.cityIds, cityId] : f.cityIds.filter((id) => id !== cityId),
    }));
  };

  const toggleSelectedCity = (cityId: string, checked: boolean) => {
    if (!selected) return;
    const nextCities = checked
      ? [...selected.cities, cities.find((c) => c.id === cityId)!].filter(Boolean)
      : selected.cities.filter((c) => c.id !== cityId);
    setSelected({ ...selected, cities: nextCities, isGlobal: false });
  };

  const scopeLabel = (r: ChannelRow) =>
    r.isGlobal ? "Глобальний" : r.cities.map((c) => c.name).join(", ") || "—";

  const CityPicker = ({
    isGlobal,
    selectedIds,
    onGlobalChange,
    onToggle,
  }: {
    isGlobal: boolean;
    selectedIds: string[];
    onGlobalChange: (v: boolean) => void;
    onToggle: (cityId: string, checked: boolean) => void;
  }) => (
    <div className="field-block">
      <label className="check-label">
        <input type="checkbox" checked={isGlobal} onChange={(e) => onGlobalChange(e.target.checked)} />
        Глобальний (усі міста)
      </label>
      {!isGlobal && (
        <div className="city-grid">
          {cities.map((c) => (
            <label key={c.id} className="check-label">
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={(e) => onToggle(c.id, e.target.checked)}
              />
              {c.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const summaryCards = [
    { key: "active", label: "Активних каналів", value: `${summary.activeChannels}/${summary.totalChannels}`, icon: IconChannel, color: "blue" },
    { key: "pubToday", label: "Публікацій сьогодні", value: summary.publicationsToday, icon: IconListings, color: "green" },
    { key: "revMonth", label: "Дохід за місяць", value: fmtMoney(summary.revenueMonth), icon: IconCard, color: "violet" },
    { key: "revToday", label: "Дохід сьогодні", value: fmtMoney(summary.revenueToday), icon: IconChart, color: "amber" },
  ] as const;

  return (
    <div className="page channels-page">
      <PageHeader
        title="Канали публікації"
        subtitle="Керування каналами та аналітика доходу"
        actions={
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Скасувати" : "+ Додати канал"}
          </button>
        }
      />

      <div className="stats-grid">
        {summaryCards.map(({ key, label, value, icon: Icon, color }) => (
          <div key={key} className={`stat-card stat-card-${color}`}>
            <div className="stat-card-icon"><Icon size={22} /></div>
            <div className="stat-card-body">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ch-toolbar">
        <input
          className="input ch-search"
          placeholder="Пошук каналу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">Усі проєкти</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Усі типи</option>
          {CHANNEL_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {showForm && (
        <FormPanel title="Новий канал" onSubmit={submit}>
          <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
            <option value="">Проєкт</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value, config: {} })}>
            {CHANNEL_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input className="input" placeholder="Назва (напр. Київ, Загальний)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {fields.map((f) => (
            <input
              key={f.key}
              className="input"
              type={f.secret ? "password" : "text"}
              placeholder={f.label}
              value={form.config[f.key] ?? ""}
              onChange={(e) => setConfig(f.key, e.target.value)}
            />
          ))}
          <CityPicker
            isGlobal={form.isGlobal}
            selectedIds={form.cityIds}
            onGlobalChange={(v) => setForm({ ...form, isGlobal: v, cityIds: v ? [] : form.cityIds })}
            onToggle={toggleCity}
          />
          <label className="check-label">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Активний
          </label>
          <button className="btn" type="submit" disabled={saving || (!form.isGlobal && !form.cityIds.length)}>
            {saving ? "..." : "Зберегти"}
          </button>
        </FormPanel>
      )}

      <div className={`ch-layout${selected ? " ch-layout-open" : ""}`}>
        <div className="ch-cards-wrap">
          {filtered.length === 0 ? (
            <div className="ch-empty">Немає каналів за обраними фільтрами</div>
          ) : (
            <div className="ch-cards">
              {filtered.map((r) => {
                const meta = channelMeta(r.type);
                const st = r.stats;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`ch-card${selected?.id === r.id ? " ch-card-active" : ""}${!r.isActive ? " ch-card-inactive" : ""}`}
                    onClick={() => setSelected(r)}
                  >
                    <div className="ch-card-head">
                      <span className="ch-card-icon" style={{ background: `${meta.color}18`, color: meta.color }}>
                        {r.type === "telegram" ? <IconTelegram size={18} /> : <IconChannel size={18} />}
                      </span>
                      <div className="ch-card-titles">
                        <strong>{r.name || meta.label}</strong>
                        <span>{r.project} · {meta.label}</span>
                      </div>
                      <span className={`ch-status${r.isActive ? " ch-status-on" : ""}`}>
                        {r.isActive ? "активний" : "вимкнено"}
                      </span>
                    </div>
                    <p className="ch-card-scope">{scopeLabel(r)}</p>
                    <div className="ch-card-metrics">
                      <div>
                        <span className="ch-metric-val">{st?.publicationsMonth ?? 0}</span>
                        <span className="ch-metric-lbl">публікацій / міс</span>
                      </div>
                      <div>
                        <span className="ch-metric-val">{fmtMoney(st?.revenueMonth ?? 0)}</span>
                        <span className="ch-metric-lbl">дохід / міс</span>
                      </div>
                      <div>
                        <span className="ch-metric-val">{st?.publicationsToday ?? 0}</span>
                        <span className="ch-metric-lbl">сьогодні</span>
                      </div>
                    </div>
                    <MiniTrend daily={st?.daily ?? []} field="revenue" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <PanelCard title={`${selected.name || channelMeta(selected.type).label} — ${selected.project}`} className="ch-detail">
            <button type="button" className="mod-back-btn" onClick={() => setSelected(null)}>← До списку</button>

            <div className="ch-detail-stats">
              <div className="ch-stat-block">
                <span className="ch-stat-label">Дохід сьогодні</span>
                <strong>{fmtMoney(selected.stats?.revenueToday ?? 0)}</strong>
              </div>
              <div className="ch-stat-block">
                <span className="ch-stat-label">Дохід за місяць</span>
                <strong>{fmtMoney(selected.stats?.revenueMonth ?? 0)}</strong>
              </div>
              <div className="ch-stat-block">
                <span className="ch-stat-label">Дохід всього</span>
                <strong>{fmtMoney(selected.stats?.revenueTotal ?? 0)}</strong>
              </div>
              <div className="ch-stat-block">
                <span className="ch-stat-label">Публікацій</span>
                <strong>{selected.stats?.publicationsPublished ?? 0} / {selected.stats?.publicationsTotal ?? 0}</strong>
              </div>
            </div>

            <div className="ch-detail-charts">
              <div className="ch-chart-box">
                <h4>Дохід (14 днів)</h4>
                <MiniTrend daily={selected.stats?.daily ?? []} field="revenue" />
              </div>
              <div className="ch-chart-box">
                <h4>Публікації (14 днів)</h4>
                <MiniTrend daily={selected.stats?.daily ?? []} field="publications" />
              </div>
            </div>

            <hr className="ch-divider" />

            <div className="field-row">
              <label className="label-sm">Назва</label>
              <input className="input" value={selected.name ?? ""} onChange={(e) => setSelected({ ...selected, name: e.target.value })} />
            </div>
            {(CONFIG_FIELDS[selected.type] ?? []).map((f) => (
              <div key={f.key} className="field-row">
                <label className="label-sm">{f.label}</label>
                <input
                  className="input"
                  type={f.secret ? "password" : "text"}
                  value={String(selected.config[f.key] ?? "")}
                  onChange={(e) => setSelectedConfig(f.key, e.target.value)}
                />
              </div>
            ))}
            <CityPicker
              isGlobal={selected.isGlobal}
              selectedIds={selected.cities.map((c) => c.id)}
              onGlobalChange={(v) => setSelected({ ...selected, isGlobal: v, cities: v ? [] : selected.cities })}
              onToggle={toggleSelectedCity}
            />
            <label className="check-label" style={{ marginTop: "0.75rem" }}>
              <input type="checkbox" checked={selected.isActive} onChange={(e) => setSelected({ ...selected, isActive: e.target.checked })} />
              Активний
            </label>
            <div className="actions" style={{ marginTop: "1rem" }}>
              <button className="btn" onClick={saveSelected} disabled={saving}>{saving ? "..." : "Зберегти"}</button>
              <button className="btn btn-danger" onClick={() => remove(selected.id)}>Видалити</button>
            </div>
          </PanelCard>
        )}
      </div>

      <p className="hint ch-hint">
        Дохід розподіляється пропорційно між каналами оголошення. Загальний дохід платформи: {fmtMoney(summary.revenueTotal)}.
      </p>
    </div>
  );
}
