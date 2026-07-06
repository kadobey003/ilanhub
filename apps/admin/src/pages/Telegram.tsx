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
  const [supportMessage, setSupportMessage] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [supportLabel, setSupportLabel] = useState("");
  const [siteLabel, setSiteLabel] = useState("");
  const [channelsLabel, setChannelsLabel] = useState("");
  const [showSupport, setShowSupport] = useState(true);
  const [showSite, setShowSite] = useState(true);
  const [showChannels, setShowChannels] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const applySettings = (data: TelegramSettings) => {
    setSettings(data);
    setBotToken(data.botToken);
    setWebhookUrl(data.webhookUrl);
    setIsActive(data.isActive);
    setSupportMessage(data.supportMessage);
    setSiteUrl(data.siteUrl);
    setSupportLabel(data.supportLabel);
    setSiteLabel(data.siteLabel);
    setChannelsLabel(data.channelsLabel);
    setShowSupport(data.showSupport);
    setShowSite(data.showSite);
    setShowChannels(data.showChannels);
  };

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
      .then((r) => applySettings(r.data))
      .catch((e) => setError(String(e)));
  }, [projectId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError("Спочатку потрібен проєкт (seed)");
      return;
    }
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const r = await api.saveTelegramSettings({
        projectId,
        botToken: botToken.trim() || undefined,
        webhookUrl: webhookUrl.trim() || undefined,
        isActive,
        supportMessage,
        siteUrl,
        supportLabel,
        siteLabel,
        channelsLabel,
        showSupport,
        showSite,
        showChannels,
      });
      applySettings(r.data);
      setMsg("Збережено. Бот оновлено з панелі.");

      if (r.data.webhookUrl.startsWith("https://") && botToken.trim()) {
        try {
          const wh = await api.registerTelegramWebhook(projectId);
          setMsg(`Збережено. Webhook: ${wh.webhookUrl}`);
        } catch (whErr) {
          setMsg(
            `Збережено, але webhook не встановлено: ${String(whErr).replace("Error: ", "")}`,
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
        subtitle="Бот, меню та кнопки головного екрану"
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

          <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--border)" }} />

          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Головне меню бота</h3>
          <p className="hint">
            Тексти кнопок «Підтримка», «Наш сайт» та «Наші канали». Список каналів
            береться з розділу «Канали» (Telegram, публікація).
          </p>

          <label className="label-sm">Текст підтримки</label>
          <textarea
            className="input"
            rows={3}
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
          />

          <label className="label-sm">URL сайту</label>
          <input
            className="input"
            placeholder="https://ilanhub.com"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
          />

          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label-sm">Кнопка «Підтримка»</label>
              <input
                className="input"
                value={supportLabel}
                onChange={(e) => setSupportLabel(e.target.value)}
              />
              <label className="check-label" style={{ marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={showSupport}
                  onChange={(e) => setShowSupport(e.target.checked)}
                />
                Показувати
              </label>
            </div>
            <div>
              <label className="label-sm">Кнопка «Сайт»</label>
              <input
                className="input"
                value={siteLabel}
                onChange={(e) => setSiteLabel(e.target.value)}
              />
              <label className="check-label" style={{ marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={showSite}
                  onChange={(e) => setShowSite(e.target.checked)}
                />
                Показувати
              </label>
            </div>
          </div>

          <label className="label-sm" style={{ marginTop: "0.75rem" }}>
            Кнопка «Наші канали»
          </label>
          <input
            className="input"
            value={channelsLabel}
            onChange={(e) => setChannelsLabel(e.target.value)}
          />
          <label className="check-label" style={{ marginTop: "0.5rem" }}>
            <input
              type="checkbox"
              checked={showChannels}
              onChange={(e) => setShowChannels(e.target.checked)}
            />
            Показувати список каналів
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
