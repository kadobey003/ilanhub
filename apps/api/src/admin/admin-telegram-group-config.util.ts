import type { AdminListingEvent } from "./admin-telegram-group.util.js";

export type AdminGroupNotify = {
  submittedPayment: boolean;
  submittedModeration: boolean;
  paymentReceived: boolean;
  resubmitted: boolean;
  moderationActions: boolean;
};

export type AdminGroupConfig = {
  chatId: string;
  enabled: boolean;
  notify: AdminGroupNotify;
};

export type AdminGroupSettingsDto = {
  adminChatId?: string;
  adminGroupEnabled?: boolean;
  notifySubmittedPayment?: boolean;
  notifySubmittedModeration?: boolean;
  notifyPaymentReceived?: boolean;
  notifyResubmitted?: boolean;
  notifyModerationActions?: boolean;
};

export function defaultAdminChatId(): string {
  return process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || "-5483319216";
}

export function defaultAdminGroupNotify(): AdminGroupNotify {
  return {
    submittedPayment: true,
    submittedModeration: true,
    paymentReceived: true,
    resubmitted: true,
    moderationActions: true,
  };
}

export function defaultAdminGroup(): AdminGroupConfig {
  return {
    chatId: defaultAdminChatId(),
    enabled: true,
    notify: defaultAdminGroupNotify(),
  };
}

export function parseAdminGroup(cfg: Record<string, unknown>): AdminGroupConfig {
  const raw = (cfg.adminGroup ?? {}) as Record<string, unknown>;
  const notifyRaw = (raw.notify ?? {}) as Record<string, unknown>;
  const defaults = defaultAdminGroup();
  return {
    chatId: String(raw.chatId ?? defaults.chatId).trim() || defaults.chatId,
    enabled: raw.enabled !== false,
    notify: {
      submittedPayment: notifyRaw.submittedPayment !== false,
      submittedModeration: notifyRaw.submittedModeration !== false,
      paymentReceived: notifyRaw.paymentReceived !== false,
      resubmitted: notifyRaw.resubmitted !== false,
      moderationActions: notifyRaw.moderationActions !== false,
    },
  };
}

export function buildAdminGroupConfig(
  prev: Record<string, unknown>,
  dto: AdminGroupSettingsDto,
): AdminGroupConfig {
  const prevGroup = parseAdminGroup(prev);
  return {
    chatId:
      dto.adminChatId !== undefined
        ? dto.adminChatId.trim() || prevGroup.chatId
        : prevGroup.chatId,
    enabled: dto.adminGroupEnabled ?? prevGroup.enabled,
    notify: {
      submittedPayment:
        dto.notifySubmittedPayment ?? prevGroup.notify.submittedPayment,
      submittedModeration:
        dto.notifySubmittedModeration ?? prevGroup.notify.submittedModeration,
      paymentReceived:
        dto.notifyPaymentReceived ?? prevGroup.notify.paymentReceived,
      resubmitted: dto.notifyResubmitted ?? prevGroup.notify.resubmitted,
      moderationActions:
        dto.notifyModerationActions ?? prevGroup.notify.moderationActions,
    },
  };
}

export function adminGroupToApi(group: AdminGroupConfig) {
  return {
    adminChatId: group.chatId,
    adminGroupEnabled: group.enabled,
    notifySubmittedPayment: group.notify.submittedPayment,
    notifySubmittedModeration: group.notify.submittedModeration,
    notifyPaymentReceived: group.notify.paymentReceived,
    notifyResubmitted: group.notify.resubmitted,
    notifyModerationActions: group.notify.moderationActions,
  };
}

const EVENT_NOTIFY_KEY: Record<
  AdminListingEvent,
  keyof AdminGroupNotify
> = {
  submitted_payment: "submittedPayment",
  submitted_moderation: "submittedModeration",
  payment_received: "paymentReceived",
  resubmitted: "resubmitted",
};

export function isListingEventEnabled(
  group: AdminGroupConfig,
  event: AdminListingEvent,
): boolean {
  if (!group.enabled) return false;
  const key = EVENT_NOTIFY_KEY[event];
  return group.notify[key];
}

export function isModerationActionsEnabled(group: AdminGroupConfig): boolean {
  return group.enabled && group.notify.moderationActions;
}
