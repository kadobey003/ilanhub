import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Alert, DataTable, FormPanel } from "../components/ui";
import { api, type CategoryRow, type ProjectRow } from "../api/client";

const EMPTY = { projectId: "", name: "", slug: "", sortOrder: 0, isActive: true };

export function Categories() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    api.projects().then((r) => {
      setProjects(r.data);
      if (!projectFilter && r.data[0]) setProjectFilter(r.data[0].id);
    }).catch(() => {});
    api
      .categories(projectFilter || undefined)
      .then((r) => setRows(r.data))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [projectFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("new");
    setError("");
    setMsg("");
    try {
      await api.createCategory({
        projectId: form.projectId || projectFilter,
        name: form.name,
        slug: form.slug || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
      setShowForm(false);
      setForm(EMPTY);
      setMsg("Додано");
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(null);
    }
  };

  const save = async (row: CategoryRow) => {
    setSaving(row.id);
    setError("");
    setMsg("");
    try {
      await api.updateCategory(row.id, {
        name: row.name,
        slug: row.slug,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      });
      setMsg("Збережено");
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Видалити категорію?")) return;
    setError("");
    try {
      await api.deleteCategory(id);
      setMsg("Видалено");
      load();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    }
  };

  const patch = (id: string, data: Partial<CategoryRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  return (
    <div className="page">
      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <PageHeader
        title="Категорії"
        subtitle="Категорії оголошень по проєктах"
        actions={
          <>
            <select
              className="input"
              style={{ maxWidth: 220 }}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button className="btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Скасувати" : "+ Категорія"}
            </button>
          </>
        }
      />

      <p className="hint">
        Категорії проєкту (Horeca: ресторан, кафе, бар…). Відображаються в Telegram-боті при подачі оголошення.
      </p>

      {showForm && (
        <FormPanel title="Нова категорія" onSubmit={submit}>
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
            className="input input-sm"
            type="number"
            placeholder="Порядок"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Активна
          </label>
          <button className="btn" type="submit" disabled={saving === "new"}>
            {saving === "new" ? "..." : "Зберегти"}
          </button>
        </FormPanel>
      )}

      <DataTable empty="Немає категорій" isEmpty={rows.length === 0}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Slug</th>
              <th>Порядок</th>
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
                <td data-label="Порядок">
                  <input
                    className="input input-sm"
                    type="number"
                    value={r.sortOrder}
                    onChange={(e) => patch(r.id, { sortOrder: Number(e.target.value) })}
                  />
                </td>
                <td data-label="Статус">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={r.isActive}
                      onChange={(e) => patch(r.id, { isActive: e.target.checked })}
                    />
                    {r.isActive ? "активна" : "неактивна"}
                  </label>
                </td>
                <td data-label="" className="actions">
                  <button className="btn btn-sm btn-success" disabled={saving === r.id} onClick={() => save(r)}>Зберегти</button>
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
