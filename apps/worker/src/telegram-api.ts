type TgResponse = {
  ok: boolean;
  result?: { message_id?: number };
  description?: string;
};

/** Telegram bot upload/file_id or HTTPS URL */
export function resolveTelegramPhotoRef(ref: string): string {
  if (ref.startsWith("tg:")) return ref.slice(3);
  return ref;
}

export async function telegramSendMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<number> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  const body = (await res.json()) as TgResponse;
  if (!body.ok) {
    throw new Error(body.description ?? `sendMessage HTTP ${res.status}`);
  }
  return body.result?.message_id ?? 0;
}

export async function telegramSendPhoto(
  token: string,
  chatId: string,
  photoUrl: string,
  caption?: string,
): Promise<number> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: resolveTelegramPhotoRef(photoUrl),
      caption,
      parse_mode: "HTML",
    }),
  });
  const body = (await res.json()) as TgResponse;
  if (!body.ok) {
    throw new Error(body.description ?? `sendPhoto HTTP ${res.status}`);
  }
  return body.result?.message_id ?? 0;
}

export async function telegramSendPhotoBuffer(
  token: string,
  chatId: string,
  photo: Buffer,
  caption?: string,
): Promise<number> {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", new Blob([photo], { type: "image/jpeg" }), "photo.jpg");
  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const body = (await res.json()) as TgResponse;
  if (!body.ok) {
    throw new Error(body.description ?? `sendPhoto HTTP ${res.status}`);
  }
  return body.result?.message_id ?? 0;
}

export async function telegramSendMediaGroup(
  token: string,
  chatId: string,
  photoUrls: string[],
  caption?: string,
): Promise<number[]> {
  const media = photoUrls.map((url, i) => ({
    type: "photo" as const,
    media: resolveTelegramPhotoRef(url),
    ...(i === 0 && caption ? { caption, parse_mode: "HTML" as const } : {}),
  }));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, media }),
  });
  const body = (await res.json()) as TgResponse & {
    result?: Array<{ message_id: number }>;
  };
  if (!body.ok) {
    throw new Error(body.description ?? `sendMediaGroup HTTP ${res.status}`);
  }
  return (body.result ?? []).map((m) => m.message_id);
}

export async function telegramSendMediaGroupBuffers(
  token: string,
  chatId: string,
  photos: Buffer[],
  caption?: string,
): Promise<number[]> {
  const form = new FormData();
  form.append("chat_id", chatId);
  const media = photos.map((_, i) => ({
    type: "photo",
    media: `attach://photo${i}`,
    ...(i === 0 && caption ? { caption, parse_mode: "HTML" } : {}),
  }));
  form.append("media", JSON.stringify(media));
  photos.forEach((buf, i) => {
    form.append(`photo${i}`, new Blob([buf], { type: "image/jpeg" }), `photo${i}.jpg`);
  });

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
    method: "POST",
    body: form,
  });
  const body = (await res.json()) as TgResponse & {
    result?: Array<{ message_id: number }>;
  };
  if (!body.ok) {
    throw new Error(body.description ?? `sendMediaGroup HTTP ${res.status}`);
  }
  return (body.result ?? []).map((m) => m.message_id);
}
