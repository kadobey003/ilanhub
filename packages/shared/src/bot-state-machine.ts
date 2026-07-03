import { BotStep, type BotSession } from "./types.js";

export const BOT_STEP_ORDER: BotStep[] = [
  BotStep.SELECT_PROJECT,
  BotStep.SELECT_CATEGORY,
  BotStep.SELECT_CITY,
  BotStep.ADD_POSITIONS,
  BotStep.ENTER_DETAILS,
  BotStep.UPLOAD_MEDIA,
  BotStep.CONFIRM_PREVIEW,
  BotStep.PAYMENT,
  BotStep.SUBMITTED,
];

const INPUT_STEPS = new Set([
  BotStep.SELECT_PROJECT,
  BotStep.SELECT_CATEGORY,
  BotStep.SELECT_CITY,
  BotStep.ADD_POSITIONS,
  BotStep.ENTER_DETAILS,
  BotStep.UPLOAD_MEDIA,
]);

export function stepIndex(step: BotStep): number {
  return BOT_STEP_ORDER.indexOf(step);
}

export function totalInputSteps(): number {
  return INPUT_STEPS.size;
}

export function createBotSession(
  userId: string,
  channel: BotSession["channel"],
): BotSession {
  return {
    userId,
    channel,
    state: BotStep.SELECT_PROJECT,
    updatedAt: new Date().toISOString(),
    positions: [],
    mediaUrls: [],
    requiresPayment: false,
  };
}

function isStepComplete(step: BotStep, session: BotSession): boolean {
  switch (step) {
    case BotStep.SELECT_PROJECT:
      return Boolean(session.projectId);
    case BotStep.SELECT_CATEGORY:
      return Boolean(session.categoryId);
    case BotStep.SELECT_CITY:
      return Boolean(session.cityId);
    case BotStep.ADD_POSITIONS:
      return (session.positions?.length ?? 0) > 0;
    case BotStep.ENTER_DETAILS:
      return Boolean(session.title);
    case BotStep.UPLOAD_MEDIA:
      return true;
    case BotStep.CONFIRM_PREVIEW:
      return true;
    case BotStep.PAYMENT:
      return !session.requiresPayment;
    case BotStep.SUBMITTED:
      return true;
    default:
      return false;
  }
}

export function canAdvance(session: BotSession): boolean {
  return isStepComplete(session.state, session);
}

export function canTransition(
  from: BotStep,
  to: BotStep,
  session: BotSession,
): boolean {
  const fromIdx = stepIndex(from);
  const toIdx = stepIndex(to);

  if (fromIdx === -1 || toIdx === -1) return false;
  if (toIdx === fromIdx) return true;

  if (toIdx === fromIdx + 1) {
    return isStepComplete(from, session);
  }

  if (toIdx === fromIdx - 1) {
    return from !== BotStep.SUBMITTED;
  }

  if (to === BotStep.SUBMITTED) {
    return (
      (from === BotStep.CONFIRM_PREVIEW && !session.requiresPayment) ||
      (from === BotStep.PAYMENT && session.requiresPayment === true)
    );
  }

  return false;
}

export function getNextStep(
  current: BotStep,
  session: BotSession,
): BotStep | null {
  const idx = stepIndex(current);
  if (idx === -1 || idx >= BOT_STEP_ORDER.length - 1) return null;

  let next = BOT_STEP_ORDER[idx + 1]!;

  if (next === BotStep.PAYMENT && !session.requiresPayment) {
    next = BotStep.SUBMITTED;
  }

  if (!canTransition(current, next, session)) return null;
  return next;
}

export function getPrevStep(current: BotStep): BotStep | null {
  const idx = stepIndex(current);
  if (idx <= 0) return null;
  return BOT_STEP_ORDER[idx - 1] ?? null;
}

export function advanceStep(session: BotSession): BotSession {
  if (!canAdvance(session)) {
    throw new Error(`Cannot advance from step ${session.state}: incomplete data`);
  }

  const next = getNextStep(session.state, session);
  if (!next) {
    throw new Error(`No next step after ${session.state}`);
  }

  return { ...session, state: next };
}

export function goBackStep(session: BotSession): BotSession {
  const prev = getPrevStep(session.state);
  if (!prev) {
    throw new Error(`Cannot go back from step ${session.state}`);
  }

  if (prev === BotStep.PAYMENT && !session.requiresPayment) {
    const beforePayment = getPrevStep(BotStep.PAYMENT);
    if (beforePayment) {
      return { ...session, state: beforePayment };
    }
  }

  return { ...session, state: prev };
}

export function skipPayment(session: BotSession): BotSession {
  if (session.state !== BotStep.CONFIRM_PREVIEW) {
    throw new Error("Payment can only be skipped from CONFIRM_PREVIEW");
  }
  return { ...session, requiresPayment: false, state: BotStep.SUBMITTED };
}

export function submitAfterPayment(session: BotSession): BotSession {
  if (session.state !== BotStep.PAYMENT) {
    throw new Error("Can only submit after PAYMENT step");
  }
  return { ...session, state: BotStep.SUBMITTED };
}

export function progressLabel(step: BotStep): string {
  const inputIdx = [...INPUT_STEPS].indexOf(step);
  if (inputIdx === -1) return "";
  return `Крок ${inputIdx + 1} з ${totalInputSteps()}`;
}
