import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Alert, DataTable, FormPanel } from "../components/ui";
import { api, type CityRow } from "../api/client";

export function Cities() {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [showCityForm, setShowCityForm] = useState(false);
  const [cityForm, setCityForm] = useState({
    name: "",
    slug: "",
    sortOrder: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api.cities().then((r) => setCities(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const submitCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createCity({
        name: cityForm.name,
        slug: cityForm.slug || undefined,
        sortOrder: cityForm.sortOrder,
        isActive: cityForm.isActive,
      });
      setShowCityForm(false);
      setCityForm({ name: "", slug: "", sortOrder: 0, isActive: true });
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const saveCity = async (row: CityRow) => {
    setSaving(true);
    setError("");
    try {
      await api.updateCity(row.id, {
        name: row.name,
        slug: row.slug,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      });
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const removeCity = async (id: string) => {
    if (!confirm("Видалити місто?")) return;
    setError("");
    try {
      await api.deleteCity(id);
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    }
  };

  const patchCity = (id: string, patch: Partial<CityRow>) => {
    setCities((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  return (
    <div className="page">
      {error && <Alert type="error">{error}</Alert>}

      <PageHeader
        title="Міста"
        subtitle="Міста для оголошень Horeca"
        actions={
          <button className="btn" onClick={() => setShowCityForm((v) => !v)}>
            {showCityForm ? "Скасувати" : "+ Місто"}
          </button>
        }
      />

      <p className="hint">
        Неактивні міста не показуються в боті та при подачі оголошень.
      </p>

      {showCityForm && (
        <FormPanel title="Нове місто" onSubmit={submitCity}>
          <input
            className="input"
            placeholder="Назва міста"
            value={cityForm.name}
            onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Slug (авто)"
            value={cityForm.slug}
            onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value })}
          />
          <input
            className="input input-sm"
            type="number"
            placeholder="Порядок"
            value={cityForm.sortOrder}
            onChange={(e) => setCityForm({ ...cityForm, sortOrder: Number(e.target.value) })}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={cityForm.isActive}
              onChange={(e) => setCityForm({ ...cityForm, isActive: e.target.checked })}
            />
            Активне
          </label>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "..." : "Зберегти"}
          </button>
        </FormPanel>
      )}

      <DataTable empty="Немає міст" isEmpty={cities.length === 0}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Місто</th>
              <th>Slug</th>
              <th>Порядок</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.id} className={!c.isActive ? "row-inactive" : undefined}>
                <td data-label="Місто">
                  <input
                    className="input"
                    value={c.name}
                    onChange={(e) => patchCity(c.id, { name: e.target.value })}
                  />
                </td>
                <td data-label="Slug">
                  <input
                    className="input"
                    value={c.slug}
                    onChange={(e) => patchCity(c.id, { slug: e.target.value })}
                  />
                </td>
                <td data-label="Порядок">
                  <input
                    className="input input-sm"
                    type="number"
                    value={c.sortOrder}
                    onChange={(e) => patchCity(c.id, { sortOrder: Number(e.target.value) })}
                  />
                </td>
                <td data-label="Статус">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={c.isActive}
                      onChange={(e) => patchCity(c.id, { isActive: e.target.checked })}
                    />
                    {c.isActive ? (
                      <span className="badge badge-published">активне</span>
                    ) : (
                      <span className="badge badge-removed">неактивне</span>
                    )}
                  </label>
                </td>
                <td data-label="" className="actions">
                  <button className="btn btn-sm btn-success" disabled={saving} onClick={() => saveCity(c)}>
                    Зберегти
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeCity(c.id)}>
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
