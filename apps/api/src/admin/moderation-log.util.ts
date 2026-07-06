export type ModerationAction =
  | "approve"
  | "reject"
  | "request_changes"
  | "confirm_payment"
  | "cancel"
  | "republish";

export type ModerationLogRow = {
  id: string;
  listingId: string;
  moderatorId: string;
  action: string;
  note: string | null;
  createdAt: Date;
};

export type ModerationLogEnriched = {
  id: string;
  action: ModerationAction;
  actionLabel: string;
  note: string | null;
  moderatorName: string;
  createdAt: string;
};

export type ModerationSummary = {
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  paymentConfirmedBy: string | null;
  paymentConfirmedAt: string | null;
  republishedBy: string | null;
  republishedAt: string | null;
};

const ACTION_LABELS: Record<ModerationAction, string> = {
  approve: "Схвалено",
  reject: "Відхилено",
  request_changes: "Запит змін",
  confirm_payment: "Оплату підтверджено",
  cancel: "Скасовано",
  republish: "Поставлено на публікацію",
};

export function moderationActionLabel(action: string): string {
  return ACTION_LABELS[action as ModerationAction] ?? action;
}

export function isLegacyCancelLog(action: string, note: string | null): boolean {
  return action === "reject" && Boolean(note?.includes("Скасовано"));
}

export function displayAction(action: string, note: string | null): ModerationAction {
  if (isLegacyCancelLog(action, note)) return "cancel";
  return action as ModerationAction;
}

export function emptyModerationSummary(): ModerationSummary {
  return {
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    cancelledBy: null,
    cancelledAt: null,
    paymentConfirmedBy: null,
    paymentConfirmedAt: null,
    republishedBy: null,
    republishedAt: null,
  };
}

export function applyModerationLog(
  summary: ModerationSummary,
  action: string,
  note: string | null,
  name: string,
  at: string,
): void {
  const key = displayAction(action, note);
  switch (key) {
    case "approve":
      if (!summary.approvedBy) {
        summary.approvedBy = name;
        summary.approvedAt = at;
      }
      break;
    case "reject":
      if (!summary.rejectedBy) {
        summary.rejectedBy = name;
        summary.rejectedAt = at;
      }
      break;
    case "cancel":
      if (!summary.cancelledBy) {
        summary.cancelledBy = name;
        summary.cancelledAt = at;
      }
      break;
    case "confirm_payment":
      if (!summary.paymentConfirmedBy) {
        summary.paymentConfirmedBy = name;
        summary.paymentConfirmedAt = at;
      }
      break;
    case "republish":
      if (!summary.republishedBy) {
        summary.republishedBy = name;
        summary.republishedAt = at;
      }
      break;
    default:
      break;
  }
}

export function enrichModerationLogs(
  logs: ModerationLogRow[],
  resolveName: (moderatorId: string, email: string | null, userName: string | null) => string,
  userMeta: Map<string, { email: string | null; name: string | null }>,
): ModerationLogEnriched[] {
  return logs.map((log) => {
    const meta = userMeta.get(log.moderatorId);
    const action = displayAction(log.action, log.note);
    return {
      id: log.id,
      action,
      actionLabel: moderationActionLabel(action),
      note: log.note,
      moderatorName: resolveName(
        log.moderatorId,
        meta?.email ?? null,
        meta?.name ?? null,
      ),
      createdAt: log.createdAt.toISOString(),
    };
  });
}
