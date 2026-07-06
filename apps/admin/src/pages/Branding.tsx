import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Alert, PanelCard } from "../components/ui";
import { api } from "../api/client";

export function Branding() {
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .branding()
      .then((r) => {
        setBrandName(r.data.brandName);
        setLogoUrl(r.data.logoUrl);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setError("Назва бренду обовʼязкова");
      return;
    }
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const r = await api.saveBranding({ brandName: brandName.trim() });
      setBrandName(r.data.brandName);
      setMsg("Назву збережено");
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const onLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Оберіть зображення (PNG, JPG, WebP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Файл має бути менше 2 МБ");
      return;
    }

    setUploading(true);
    setError("");
    setMsg("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const r = await api.uploadBrandingLogo(dataUrl);
      setLogoUrl(r.data.logoUrl);
      setMsg("Логотип оновлено");
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <PageHeader
        title="Брендинг"
        subtitle="Логотип та назва на сайті й в адмінці"
      />
      {error && <Alert variant="error">{error}</Alert>}
      {msg && <Alert variant="success">{msg}</Alert>}

      <PanelCard title="Поточний логотип" className="branding-preview">
        <div className="branding-preview-row">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName || "Logo"} className="branding-logo-preview" />
          ) : (
            <p className="text-muted">Логотип не завантажено</p>
          )}
        </div>
        <label className="btn btn-secondary" style={{ marginTop: 12, cursor: "pointer" }}>
          {uploading ? "Завантаження…" : "Завантажити логотип"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onLogoPick}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
        <p className="text-muted" style={{ marginTop: 8, fontSize: 13 }}>
          PNG, JPG або WebP, до 2 МБ. Рекомендовано квадратне зображення.
        </p>
      </PanelCard>

      <PanelCard title="Назва бренду" className="branding-form">
        <form onSubmit={saveName}>
          <label className="label">Назва на сайті</label>
          <input
            className="input"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="UAREKLAMHUB"
          />
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 12 }}>
            {saving ? "Збереження…" : "Зберегти назву"}
          </button>
        </form>
      </PanelCard>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.readAsDataURL(file);
  });
}
