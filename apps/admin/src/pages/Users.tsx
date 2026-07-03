import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type MessengerChannel,
  type UserBroadcastResult,
  type UserDetail,
  type UserRow,
} from "../api/client";
import { FormPanel, Modal, SelectionBar } from "../components/ui";
import { IconUsers } from "../components/icons";

const CHANNEL_LABELS: Record<string, string> = {
  telegram: "Telegram",
  viber: "Viber",
  whatsapp: "WhatsApp",
  web: "Веб",
};

const CHANNEL_COLORS: Record<string, string> = {
  telegram: "telegram",
  viber: "viber",
  whatsapp: "whatsapp",
  web: "web",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Чернетка",
  pending_payment: "Очікує оплати",
  pending_moderation: "На модерації",
  approved: "Схвалено",
  published: "Опубліковано",
  rejected: "Відхилено",
  expired: "Скасовано",
};

const STATUS_TONES: Record<string, string> = {
  draft: "default",
  pending_payment: "payment",
  pending_moderation: "pending",
  approved: "approved",
  published: "published",
  rejected: "rejected",
  expired: "expired",
};

const PAYMENT_STATUS: Record<string, string> = {
  pending: "Очікує",
  completed: "Оплачено",
  failed: "Помилка",
  refunded: "Повернено",
};

const BOOST_LABELS: Record<string, string> = {
  pin: "Закріплення",
  feature: "Виділення",
  bump: "Підняття",
};

type MessageMode = "single" | "bulk" | null;
type ChannelFilter = "all" | "telegram" | "viber" | "whatsapp" | "web";

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

function fmtMoney(amount: number, currency = "UAH") {
  return `${amount.toLocaleString("uk-UA")} ${currency === "UAH" ? "₴" : currency}`;
}

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "default";
  return (
    <span className={`mod-badge mod-badge-${tone}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span className={`usr-channel usr-channel-${CHANNEL_COLORS[channel] ?? "web"}`}>
      {CHANNEL_LABELS[channel] ?? channel}
    </span>
  );
}

export function Users() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [messageMode, setMessageMode] = useState<MessageMode>(null);
  const [targetUser, setTargetUser] = useState<UserRow | null>(null);
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<MessengerChannel | "all">("all");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UserBroadcastResult | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    telegramId: "",
    viberId: "",
    whatsappId: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    api
      .users()
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    const totalSpent = rows.reduce((s, r) => s + (r.totalSpent ?? 0), 0);
    const totalListings = rows.reduce((s, r) => s + r.listingsCount, 0);
    const messengers = rows.filter((r) => r.channel !== "web").length;
    return { totalSpent, totalListings, messengers };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (channelFilter !== "all" && r.channel !== channelFilter) return false;
      if (!q) return true;
      return (
        (r.name?.toLowerCase().includes(q) ?? false) ||
        (r.email?.toLowerCase().includes(q) ?? false) ||
        (r.phone?.includes(q) ?? false)
      );
    });
  }, [rows, search, channelFilter]);

  const messagable = useMemo(
    () => filtered.filter((r) => r.channel !== "web"),
    [filtered],
  );

  const selectedRow = filtered.find((r) => r.id === selectedId) ?? null;

  const selectUser = async (row: UserRow) => {
    setSelectedId(row.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.user(row.id);
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const toggleAll = () => {
    if (selected.size === messagable.length) setSelected(new Set());
    else setSelected(new Set(messagable.map((r) => r.id)));
  };

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openSingle = (user: UserRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTargetUser(user);
    setMessageMode("single");
    setMessage("");
    setChannel(user.channel as MessengerChannel);
    setError("");
    setResult(null);
  };

  const openBulk = () => {
    setMessageMode("bulk");
    setTargetUser(null);
    setMessage("");
    setChannel("all");
    setError("");
    setResult(null);
  };

  const closeModal = () => {
    setMessageMode(null);
    setTargetUser(null);
    setMessage("");
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createUser({
      name: form.name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      telegramId: form.telegramId || undefined,
      viberId: form.viberId || undefined,
      whatsappId: form.whatsappId || undefined,
    });
    setShowForm(false);
    setForm({ name: "", email: "", phone: "", telegramId: "", viberId: "", whatsappId: "" });
    load();
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      setError("Введіть текст повідомлення");
      return;
    }
    setSending(true);
    setError("");
    setResult(null);
    try {
      if (messageMode === "single" && targetUser) {
        const res = await api.sendUserMessage(targetUser.id, {
          message: message.trim(),
          channel: channel === "all" ? undefined : channel,
        });
        setResult({
          sent: res.ok ? 1 : 0,
          failed: res.ok ? 0 : 1,
          total: 1,
          results: [res],
        });
      } else {
        const res = await api.broadcastUsers({
          message: message.trim(),
          userIds: selected.size ? [...selected] : undefined,
          channel,
        });
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка відправки");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page usr-page">
      <header className="mod-header">
        <div>
          <h2 className="page-title mod-title">Користувачі</h2>
          <p className="mod-subtitle">
            Профілі, оголошення, платежі та активність користувачів
          </p>
        </div>
        <div className="usr-header-actions">
          <button className="btn btn-outline" onClick={openBulk}>
            Масове повідомлення
          </button>
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            {loading ? "…" : "Оновити"}
          </button>
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Скасувати" : "+ Додати"}
          </button>
        </div>
      </header>

      <div className="stats-grid usr-stats">
        <div className="stat-card stat-card-blue">
          <div className="stat-card-icon"><IconUsers size={22} /></div>
          <div className="stat-card-body">
            <span className="stat-value">{rows.length.toLocaleString("uk-UA")}</span>
            <span className="stat-label">Користувачів</span>
          </div>
        </div>
        <div className="stat-card stat-card-violet">
          <div className="stat-card-icon">₴</div>
          <div className="stat-card-body">
            <span className="stat-value">{summary.totalSpent.toLocaleString("uk-UA")} ₴</span>
            <span className="stat-label">Загальний дохід</span>
          </div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-body">
            <span className="stat-value">{summary.totalListings.toLocaleString("uk-UA")}</span>
            <span className="stat-label">Оголошень</span>
          </div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-card-icon">💬</div>
          <div className="stat-card-body">
            <span className="stat-value">{summary.messengers.toLocaleString("uk-UA")}</span>
            <span className="stat-label">Месенджери</span>
          </div>
        </div>
      </div>

      {showForm && (
        <FormPanel title="Новий користувач" onSubmit={submit}>
          <input className="input" placeholder="Ім'я" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="Telegram ID" value={form.telegramId} onChange={(e) => setForm({ ...form, telegramId: e.target.value })} />
          <input className="input" placeholder="Viber ID" value={form.viberId} onChange={(e) => setForm({ ...form, viberId: e.target.value })} />
          <input className="input" placeholder="WhatsApp ID" value={form.whatsappId} onChange={(e) => setForm({ ...form, whatsappId: e.target.value })} />
          <button className="btn" type="submit">Зберегти</button>
        </FormPanel>
      )}

      {selected.size > 0 && (
        <SelectionBar count={selected.size}>
          <button className="btn btn-sm" onClick={openBulk}>Надіслати обраним</button>
          <button className="btn btn-sm btn-outline" onClick={() => setSelected(new Set())}>Скасувати вибір</button>
        </SelectionBar>
      )}

      <div className="mod-tabs usr-tabs">
        {(["all", "telegram", "viber", "whatsapp", "web"] as const).map((ch) => (
          <button
            key={ch}
            type="button"
            className={`mod-tab${channelFilter === ch ? " mod-tab-active" : ""}`}
            onClick={() => setChannelFilter(ch)}
          >
            {ch === "all" ? "Усі" : CHANNEL_LABELS[ch]}
          </button>
        ))}
      </div>

      <div className="mod-toolbar">
        <div className="mod-search-wrap">
          <span className="mod-search-icon" aria-hidden>⌕</span>
          <input
            className="input mod-search"
            placeholder="Пошук за ім'ям, email або телефоном…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {messagable.length > 0 && (
          <label className="usr-select-all">
            <input
              type="checkbox"
              checked={selected.size === messagable.length && messagable.length > 0}
              onChange={toggleAll}
            />
            Обрати всіх ({messagable.length})
          </label>
        )}
      </div>

      <div className={`mod-layout${selectedId ? " mod-layout-detail-open" : ""}`}>
        <aside className="mod-list-panel card">
          {loading ? (
            <div className="mod-empty">
              <div className="mod-spinner" />
              <p>Завантаження…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mod-empty">
              <span className="mod-empty-icon">👤</span>
              <p>{search ? "Нічого не знайдено" : "Немає користувачів"}</p>
            </div>
          ) : (
            <ul className="mod-list">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`mod-list-item usr-list-item${selectedId === r.id ? " mod-list-item-active" : ""}`}
                    onClick={() => selectUser(r)}
                  >
                    <div className="usr-list-row">
                      {r.channel !== "web" && (
                        <input
                          type="checkbox"
                          className="usr-check"
                          checked={selected.has(r.id)}
                          onClick={(e) => toggleOne(r.id, e)}
                          onChange={() => {}}
                        />
                      )}
                      <div className={`usr-avatar usr-avatar-${CHANNEL_COLORS[r.channel] ?? "web"}`}>
                        {initials(r.name)}
                      </div>
                      <div className="usr-list-body">
                        <div className="mod-list-top">
                          <span className="mod-list-title">{r.name ?? "Без імені"}</span>
                          <ChannelBadge channel={r.channel} />
                        </div>
                        <div className="mod-list-meta">
                          <span>{r.email ?? r.phone ?? "—"}</span>
                        </div>
                        <div className="usr-list-stats">
                          <span className="usr-stat-pill">
                            📋 {r.listingsCount}
                            {(r.publishedCount ?? 0) > 0 && (
                              <em> · {r.publishedCount} опубл.</em>
                            )}
                          </span>
                          {(r.totalSpent ?? 0) > 0 && (
                            <span className="usr-stat-pill usr-stat-money">
                              {fmtMoney(r.totalSpent ?? 0)}
                            </span>
                          )}
                        </div>
                        {r.createdAt && (
                          <div className="mod-list-date">З {fmtDate(r.createdAt)}</div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="mod-detail-panel card">
          {!selectedRow ? (
            <div className="mod-empty mod-empty-detail">
              <span className="mod-empty-icon">👈</span>
              <p>Оберіть користувача зі списку</p>
              <span className="mod-empty-hint">
                Оголошення, платежі та деталі профілю зʼявляться тут
              </span>
            </div>
          ) : detailLoading ? (
            <div className="mod-empty">
              <div className="mod-spinner" />
              <p>Завантаження…</p>
            </div>
          ) : (
            <>
              <button type="button" className="mod-back-btn" onClick={clearSelection}>
                ← До списку
              </button>

              <div className="usr-profile-head">
                <div className={`usr-avatar-lg usr-avatar-${CHANNEL_COLORS[detail?.channel ?? selectedRow.channel] ?? "web"}`}>
                  {initials(detail?.name ?? selectedRow.name)}
                </div>
                <div className="usr-profile-info">
                  <h3 className="mod-detail-title">{detail?.name ?? selectedRow.name ?? "Без імені"}</h3>
                  <div className="usr-profile-meta">
                    <ChannelBadge channel={detail?.channel ?? selectedRow.channel} />
                    {detail?.phoneVerifiedAt && (
                      <span className="usr-verified">✓ Телефон підтверджено</span>
                    )}
                  </div>
                  <p className="mod-detail-date">
                    Реєстрація {fmtDate(detail?.createdAt ?? selectedRow.createdAt)}
                  </p>
                </div>
                {selectedRow.channel !== "web" && (
                  <button
                    className="btn btn-sm btn-outline usr-msg-btn"
                    onClick={(e) => openSingle(selectedRow, e)}
                  >
                    ✉ Надіслати
                  </button>
                )}
              </div>

              <div className="usr-kpi-grid">
                <div className="usr-kpi">
                  <span className="usr-kpi-value">{detail?.stats.listingsTotal ?? selectedRow.listingsCount}</span>
                  <span className="usr-kpi-label">Оголошень</span>
                </div>
                <div className="usr-kpi">
                  <span className="usr-kpi-value usr-kpi-green">{detail?.stats.listingsPublished ?? selectedRow.publishedCount ?? 0}</span>
                  <span className="usr-kpi-label">Опубліковано</span>
                </div>
                <div className="usr-kpi">
                  <span className="usr-kpi-value usr-kpi-violet">{fmtMoney(detail?.stats.totalSpent ?? selectedRow.totalSpent ?? 0)}</span>
                  <span className="usr-kpi-label">Витрачено</span>
                </div>
                <div className="usr-kpi">
                  <span className="usr-kpi-value">{detail?.stats.publicationsCount ?? 0}</span>
                  <span className="usr-kpi-label">Публікацій</span>
                </div>
              </div>

              <div className="mod-info-grid">
                <div className="mod-info-item">
                  <span className="mod-info-label">Email</span>
                  <span className="mod-info-value">{detail?.email ?? selectedRow.email ?? "—"}</span>
                </div>
                <div className="mod-info-item">
                  <span className="mod-info-label">Телефон</span>
                  <span className="mod-info-value mod-phone">{detail?.phone ?? selectedRow.phone ?? "—"}</span>
                </div>
                {detail?.telegramId && (
                  <div className="mod-info-item">
                    <span className="mod-info-label">Telegram ID</span>
                    <span className="mod-info-value">{detail.telegramId}</span>
                  </div>
                )}
                {detail?.viberId && (
                  <div className="mod-info-item">
                    <span className="mod-info-label">Viber ID</span>
                    <span className="mod-info-value">{detail.viberId}</span>
                  </div>
                )}
                {detail?.whatsappId && (
                  <div className="mod-info-item">
                    <span className="mod-info-label">WhatsApp ID</span>
                    <span className="mod-info-value">{detail.whatsappId}</span>
                  </div>
                )}
                <div className="mod-info-item">
                  <span className="mod-info-label">Мова</span>
                  <span className="mod-info-value">{detail?.locale ?? "uk"}</span>
                </div>
              </div>

              {detail && detail.stats.listingsPending > 0 && (
                <div className="usr-alert usr-alert-pending">
                  ⏳ {detail.stats.listingsPending} оголошень на модерації або очікують оплати
                </div>
              )}

              {detail && detail.listings.length > 0 && (
                <div className="usr-section">
                  <h4 className="usr-section-title">
                    Оголошення
                    <span className="usr-section-count">{detail.listings.length}</span>
                  </h4>
                  <div className="usr-mini-table-wrap">
                    <table className="usr-mini-table">
                      <thead>
                        <tr>
                          <th>Заголовок</th>
                          <th>Проєкт</th>
                          <th>Статус</th>
                          <th>Ціна</th>
                          <th>Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.listings.map((l) => (
                          <tr key={l.id}>
                            <td>
                              <span className="usr-listing-title">{l.title ?? "—"}</span>
                              {l.isPinned && <span className="usr-pin">📌</span>}
                            </td>
                            <td>{l.projectName}</td>
                            <td><StatusBadge status={l.status} /></td>
                            <td>{l.price ? fmtMoney(l.price, l.currency) : "—"}</td>
                            <td className="usr-date">{fmtDate(l.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detail && detail.payments.length > 0 && (
                <div className="usr-section">
                  <h4 className="usr-section-title">
                    Платежі
                    <span className="usr-section-count">{detail.payments.length}</span>
                  </h4>
                  <div className="usr-mini-table-wrap">
                    <table className="usr-mini-table">
                      <thead>
                        <tr>
                          <th>Сума</th>
                          <th>Метод</th>
                          <th>Статус</th>
                          <th>Оголошення</th>
                          <th>Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="usr-money">{fmtMoney(p.amount, p.currency)}</td>
                            <td>{p.method}</td>
                            <td>
                              <span className={`usr-pay-status usr-pay-${p.status}`}>
                                {PAYMENT_STATUS[p.status] ?? p.status}
                              </span>
                            </td>
                            <td>{p.listingTitle ?? "—"}</td>
                            <td className="usr-date">{fmtDate(p.paidAt ?? p.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detail && detail.boosts.length > 0 && (
                <div className="usr-section">
                  <h4 className="usr-section-title">
                    Просування
                    <span className="usr-section-count">{detail.boosts.length}</span>
                  </h4>
                  <ul className="usr-boost-list">
                    {detail.boosts.map((b) => (
                      <li key={b.id} className="usr-boost-item">
                        <div>
                          <span className="usr-boost-type">{BOOST_LABELS[b.type] ?? b.type}</span>
                          <span className="usr-boost-listing">{b.listingTitle ?? "—"}</span>
                        </div>
                        <div className="usr-boost-meta">
                          <span className="usr-money">{fmtMoney(b.price, b.currency)}</span>
                          <span className="usr-date">{fmtDate(b.startsAt)} — {fmtDate(b.endsAt)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail && detail.listings.length === 0 && detail.payments.length === 0 && (
                <div className="mod-empty usr-empty-activity">
                  <span className="mod-empty-icon">📭</span>
                  <p>Ще немає активності</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {messageMode && (
        <Modal
          title={
            messageMode === "single"
              ? `Повідомлення: ${targetUser?.name ?? "користувач"}`
              : selected.size
                ? `Масове повідомлення (${selected.size})`
                : "Масове повідомлення (усі)"
          }
          onClose={closeModal}
          footer={
            <>
              <button className="btn" onClick={sendMessage} disabled={sending}>
                {sending ? "Надсилання..." : "Надіслати"}
              </button>
              <button className="btn btn-outline" onClick={closeModal}>Закрити</button>
            </>
          }
        >
          {messageMode === "bulk" && (
            <div className="field-row">
              <label className="label-sm">Канал</label>
              <select
                className="input"
                value={channel}
                onChange={(e) => setChannel(e.target.value as MessengerChannel | "all")}
              >
                <option value="all">Усі канали (за профілем)</option>
                <option value="telegram">Лише Telegram</option>
                <option value="viber">Лише Viber</option>
                <option value="whatsapp">Лише WhatsApp</option>
              </select>
            </div>
          )}

          {messageMode === "single" && targetUser && (
            <p className="hint">
              Канал: {CHANNEL_LABELS[targetUser.channel] ?? targetUser.channel}
            </p>
          )}

          <textarea
            className="input textarea"
            placeholder="Текст повідомлення..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />

          {error && <div className="alert alert-error">{error}</div>}

          {result && (
            <div className="broadcast-result">
              <p className={result.failed === 0 ? "success" : "hint"}>
                Надіслано: {result.sent} · Помилок: {result.failed} · Всього: {result.total}
              </p>
              {result.failed > 0 && (
                <ul className="error-list">
                  {result.results.filter((r) => !r.ok).slice(0, 5).map((r) => (
                    <li key={r.userId}>
                      {r.userName ?? r.userId}: {r.error}
                    </li>
                  ))}
                  {result.failed > 5 && <li>…та ще {result.failed - 5}</li>}
                </ul>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
