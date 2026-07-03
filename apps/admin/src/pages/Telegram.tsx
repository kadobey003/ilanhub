import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Alert, PanelCard } from "../components/ui";
import { api, type ProjectRow, type TelegramSettings } from "../api/client";

export function Telegram() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [botToken, setBotToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .projects()
      .then((r) => {
        setProjects(r.data);
        if (r.data[0]) setProjectId(r.data[0].id);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setError("");
    setMsg("");
    api
      .telegramSettings(projectId)
      .then((r) => {
        setSettings(r.data);
        setBotToken(r.data.botToken);
        setWebhookUrl(r.data.webhookUrl);
        setIsActive(r.data.isActive);
      })
      .catch((e) => setError(String(e)));
  }, [projectId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError("Спочатку потрібен проєкт (seed)");
      return;
    }
    if (!botToken.trim()) {
      setError("Bot Token обовʼязковий");
      return;
    }
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const r = await api.saveTelegramSettings({
        projectId,
        botToken: botToken.trim(),
        webhookUrl: webhookUrl.trim() || undefined,
        isActive,
      });
      setSettings(r.data);
      setBotToken(r.data.botToken);
      setWebhookUrl(r.data.webhookUrl);
      setMsg("Збережено. Бот оновлено з панелі (без .env).");

      if (r.data.webhookUrl.startsWith("https://")) {
        try {
          const wh = await api.registerTelegramWebhook(projectId);
          setMsg(`Збережено. Webhook: ${wh.webhookUrl}`);
        } catch (whErr) {
          setMsg(
            `Токен збережено, але webhook не встановлено: ${String(whErr).replace("Error: ", "")}`,
          );
        }
      }
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const registerWebhook = async () => {
    setWebhookLoading(true);
    setError("");
    setMsg("");
    try {
      const r = await api.registerTelegramWebhook(projectId);
      setMsg(`Webhook встановлено: ${r.webhookUrl}`);
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Telegram"
        subtitle="Bot token і webhook — тільки тут (не .env)"
        actions={
          projects.length > 0 ? (
            <select
              className="input"
              style={{ maxWidth: 220 }}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {projects.length === 0 && (
        <Alert type="error">
          Проєктів немає. Deploy seed працює — оновіть сторінку або зверніться до
          адміністратора.
        </Alert>
      )}

      <PanelCard title="Бот (вхід оголошень)" className="telegram-form">
        <form onSubmit={save}>
          <p className="hint">
            Один бот на проєкт. Token з @BotFather — збережіть тут. Канали
            публікації — у розділі «Канали».
          </p>

          {settings?.botUsername && (
            <p className="bot-info">
              Бот: <strong>{settings.botUsername}</strong>
            </p>
          )}

          <label className="label-sm">Bot Token</label>
          <input
            className="input"
            type="password"
            placeholder="123456789:ABCdefGHI..."
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            autoComplete="off"
            required
          />

          <label className="label-sm">Webhook URL</label>
          <p className="hint">
            Telegram вимагає HTTPS. Домен або Cloudflare Tunnel. За замовчуванням
            з PUBLIC_URL.
          </p>
          <input
            className="input"
            placeholder="https://your-domain.com/webhooks/telegram"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />

          <label className="check-label" style={{ marginTop: "1rem" }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Активний
          </label>

          <div className="actions" style={{ marginTop: "1.25rem" }}>
            <button className="btn" type="submit" disabled={saving || !projectId}>
              {saving ? "..." : "Зберегти"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              disabled={
                webhookLoading ||
                !projectId ||
                !webhookUrl.startsWith("https://")
              }
              onClick={registerWebhook}
            >
              {webhookLoading ? "..." : "Встановити Webhook"}
            </button>
          </div>
        </form>
      </PanelCard>
    </div>
  );
}
