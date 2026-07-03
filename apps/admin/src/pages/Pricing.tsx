import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Alert, DataTable, PanelCard } from "../components/ui";
import { api, type ProjectAddonRow, type ProjectRow, type VacancyTypeRow } from "../api/client";

const BILLING_LABELS: Record<ProjectAddonRow["billingUnit"], string> = {
  fixed: "за раз",
  per_vacancy: "за вакансію",
};

const ADDON_HINTS: Record<string, string> = {
  pin: "📌 Закріплення в каналі",
  daily_duplicate: "🔁 Щоденне дублювання",
  featured: "⭐ В топ",
  republish: "🔄 Повторна публікація",
};

export function Pricing() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [rows, setRows] = useState<VacancyTypeRow[]>([]);
  const [addons, setAddons] = useState<ProjectAddonRow[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [savingAddon, setSavingAddon] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    api.projects().then((r) => setProjects(r.data)).catch(() => {});
    api
      .vacancyTypes(projectFilter || undefined)
      .then((r) => setRows(r.data))
      .catch(() => {});
    api
      .projectAddons(projectFilter || undefined)
      .then((r) => setAddons(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [projectFilter]);

  const initPricing = async (projectId: string) => {
    setError("");
    try {
      await api.initVacancyPricing(projectId);
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    }
  };

  const initAddons = async (projectId: string) => {
    setError("");
    try {
      await api.initProjectAddons(projectId);
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    }
  };

  const save = async (row: VacancyTypeRow) => {
    setSaving(row.id);
    setError("");
    try {
      await api.updateVacancyType(row.id, {
        name: row.name,
        price: row.price,
        isActive: row.isActive,
      });
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(null);
    }
  };

  const saveAddon = async (row: ProjectAddonRow) => {
    setSavingAddon(row.id);
    setError("");
    try {
      await api.updateProjectAddon(row.id, {
        name: row.name,
        description: row.description ?? undefined,
        price: row.price,
        billingUnit: row.billingUnit,
        isActive: row.isActive,
      });
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSavingAddon(null);
    }
  };

  const patch = (id: string, patch: Partial<VacancyTypeRow>) => {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const patchAddon = (id: string, patch: Partial<ProjectAddonRow>) => {
    setAddons((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const projectsWithoutPricing = projects.filter(
    (p) => !rows.some((r) => r.projectId === p.id),
  );

  const projectsWithoutAddons = projects.filter(
    (p) => !addons.some((a) => a.projectId === p.id),
  );

  return (
    <div className="page">
      {error && <Alert type="error">{error}</Alert>}

      <PageHeader
        title="Каталог цін"
        subtitle="Тарифи вакансій та додаткові послуги"
        actions={
          <select
            className="input"
            style={{ maxWidth: 220 }}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">Усі проєкти</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        }
      />

      <p className="hint">
        Бот і оплата використовують ці ціни. Закріплення, дублювання, «в топ» та повторна
        публікація налаштовуються нижче.
      </p>

      {(projectsWithoutPricing.length > 0 || projectsWithoutAddons.length > 0) && (
        <PanelCard title="Ініціалізація каталогу">
          <div className="actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            {projectsWithoutPricing.map((p) => (
              <button
                key={`v-${p.id}`}
                className="btn btn-outline"
                onClick={() => initPricing(p.id)}
              >
                + вакансії: {p.name}
              </button>
            ))}
            {projectsWithoutAddons.map((p) => (
              <button
                key={`a-${p.id}`}
                className="btn btn-outline"
                onClick={() => initAddons(p.id)}
              >
                + послуги: {p.name}
              </button>
            ))}
          </div>
        </PanelCard>
      )}

      <PanelCard title="Пакети вакансій">
        <DataTable
          empty="Немає тарифів — ініціалізуйте проєкт"
          isEmpty={rows.length === 0}
          minWidth={680}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Проєкт</th>
                <th>Вакансій</th>
                <th>Назва</th>
                <th>Ціна (₴)</th>
                <th>Активна</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Проєкт">{r.projectName}</td>
                  <td data-label="Вакансій">
                    <strong>{r.vacancyCount}</strong>
                  </td>
                  <td data-label="Назва">
                    <input
                      className="input"
                      value={r.name}
                      onChange={(e) => patch(r.id, { name: e.target.value })}
                    />
                  </td>
                  <td data-label="Ціна">
                    <input
                      className="input input-sm"
                      type="number"
                      min={0}
                      value={r.price}
                      onChange={(e) => patch(r.id, { price: Number(e.target.value) })}
                    />
                  </td>
                  <td data-label="Активна">
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={r.isActive}
                        onChange={(e) => patch(r.id, { isActive: e.target.checked })}
                      />
                      {r.isActive ? "так" : "ні"}
                    </label>
                  </td>
                  <td data-label="">
                    <button
                      className="btn btn-sm"
                      disabled={saving === r.id}
                      onClick={() => save(r)}
                    >
                      {saving === r.id ? "..." : "Зберегти"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </PanelCard>

      <PanelCard title="Додаткові послуги">
        <DataTable
          empty="Немає послуг — натисніть «+ послуги» для проєкту"
          isEmpty={addons.length === 0}
          minWidth={760}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Проєкт</th>
                <th>Послуга</th>
                <th>Назва</th>
                <th>Ціна (₴)</th>
                <th>Одиниця</th>
                <th>Активна</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {addons.map((r) => (
                <tr key={r.id}>
                  <td data-label="Проєкт">{r.projectName}</td>
                  <td data-label="Послуга">
                    <span title={r.slug}>
                      {ADDON_HINTS[r.slug] ?? r.slug}
                    </span>
                  </td>
                  <td data-label="Назва">
                    <input
                      className="input"
                      value={r.name}
                      onChange={(e) => patchAddon(r.id, { name: e.target.value })}
                    />
                  </td>
                  <td data-label="Ціна">
                    <input
                      className="input input-sm"
                      type="number"
                      min={0}
                      value={r.price}
                      onChange={(e) =>
                        patchAddon(r.id, { price: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td data-label="Одиниця">
                    <select
                      className="input input-sm"
                      value={r.billingUnit}
                      onChange={(e) =>
                        patchAddon(r.id, {
                          billingUnit: e.target.value as ProjectAddonRow["billingUnit"],
                        })
                      }
                    >
                      <option value="fixed">{BILLING_LABELS.fixed}</option>
                      <option value="per_vacancy">{BILLING_LABELS.per_vacancy}</option>
                    </select>
                  </td>
                  <td data-label="Активна">
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={r.isActive}
                        onChange={(e) =>
                          patchAddon(r.id, { isActive: e.target.checked })
                        }
                      />
                      {r.isActive ? "так" : "ні"}
                    </label>
                  </td>
                  <td data-label="">
                    <button
                      className="btn btn-sm"
                      disabled={savingAddon === r.id}
                      onClick={() => saveAddon(r)}
                    >
                      {savingAddon === r.id ? "..." : "Зберегти"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </PanelCard>
    </div>
  );
}
