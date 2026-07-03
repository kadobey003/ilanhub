import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Alert, DataTable, FormPanel } from "../components/ui";
import { api, type ProjectRow } from "../api/client";

export function Projects() {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api.projects().then((r) => setRows(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createProject({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        isActive: form.isActive,
      });
      setShowForm(false);
      setForm({ name: "", slug: "", description: "", isActive: true });
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const save = async (row: ProjectRow) => {
    setSaving(true);
    setError("");
    try {
      await api.updateProject(row.id, {
        name: row.name,
        slug: row.slug,
        description: row.description ?? undefined,
        isActive: row.isActive,
      });
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Видалити проєкт?")) return;
    setError("");
    try {
      await api.deleteProject(id);
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    }
  };

  const patch = (id: string, patch: Partial<ProjectRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="page">
      {error && <Alert type="error">{error}</Alert>}

      <PageHeader
        title="Проєкти"
        subtitle="Вертикалі та напрямки платформи"
        actions={
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Скасувати" : "+ Проєкт"}
          </button>
        }
      />

      {showForm && (
        <FormPanel title="Новий проєкт" onSubmit={submit}>
          <input
            className="input"
            placeholder="Назва"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Slug (авто)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <input
            className="input"
            placeholder="Опис"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Активний
          </label>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "..." : "Зберегти"}
          </button>
        </FormPanel>
      )}

      <DataTable empty="Немає проєктів" isEmpty={rows.length === 0}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Slug</th>
              <th>Опис</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="Назва">
                  <input
                    className="input"
                    value={r.name}
                    onChange={(e) => patch(r.id, { name: e.target.value })}
                  />
                </td>
                <td data-label="Slug">
                  <input
                    className="input"
                    value={r.slug}
                    onChange={(e) => patch(r.id, { slug: e.target.value })}
                  />
                </td>
                <td data-label="Опис">
                  <input
                    className="input"
                    value={r.description ?? ""}
                    onChange={(e) => patch(r.id, { description: e.target.value })}
                  />
                </td>
                <td data-label="Статус">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={r.isActive}
                      onChange={(e) => patch(r.id, { isActive: e.target.checked })}
                    />
                    {r.isActive ? "активний" : "неактивний"}
                  </label>
                </td>
                <td data-label="" className="actions">
                  <button className="btn btn-sm btn-success" disabled={saving} onClick={() => save(r)}>Зберегти</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Видалити</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
