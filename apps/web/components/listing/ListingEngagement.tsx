"use client";

import { useCallback, useEffect, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics-api";
import { PUBLIC_API_URL } from "@/lib/api-url";
import type { ListingComment, ListingEngagement } from "@/lib/listings-types";

interface Props {
  listingId: string;
  projectId: string;
  initial: ListingEngagement;
  isHoreca?: boolean;
}

function formatCommentDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function likeStorageKey(listingId: string): string {
  return `ilanhub:liked:${listingId}`;
}

export function ListingEngagement({
  listingId,
  projectId,
  initial,
  isHoreca,
}: Props) {
  const [views, setViews] = useState(initial.views);
  const [likes, setLikes] = useState(initial.likes);
  const [comments, setComments] = useState<ListingComment[]>(initial.comments);
  const [liked, setLiked] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLiked(localStorage.getItem(likeStorageKey(listingId)) === "1");
  }, [listingId]);

  const handleLike = useCallback(() => {
    if (liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    localStorage.setItem(likeStorageKey(listingId), "1");
    trackAnalyticsEvent({
      eventType: "like",
      projectId,
      listingId,
    });
  }, [liked, listingId, projectId]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = document.title;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg("Посилання скопійовано");
      setTimeout(() => setShareMsg(null), 2000);
    } catch {
      setShareMsg(null);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!authorName.trim() || !body.trim()) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(
          `${PUBLIC_API_URL}/api/listings/${listingId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authorName: authorName.trim(),
              body: body.trim(),
            }),
          },
        );
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        const comment = json.data as ListingComment;
        setComments((prev) => [comment, ...prev]);
        setBody("");
      } catch {
        setError("Не вдалося надіслати коментар");
      } finally {
        setSubmitting(false);
      }
    },
    [authorName, body, listingId],
  );

  useEffect(() => {
    setViews(initial.views);
    setLikes(initial.likes);
    setComments(initial.comments);
  }, [initial]);

  const accentBtn = isHoreca
    ? "rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
    : "rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50";

  return (
    <section className="mt-6 space-y-5 border-t border-slate-100 pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={liked}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            liked
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          }`}
        >
          <span aria-hidden>{liked ? "❤️" : "🤍"}</span>
          {likes > 0 ? likes : "Подобається"}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
        >
          <span aria-hidden>↗</span>
          Поділитися
        </button>

        {shareMsg && (
          <span className="text-xs font-medium text-emerald-600">{shareMsg}</span>
        )}

        <span className="ml-auto text-xs text-slate-400">
          👁 {views} переглядів
        </span>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          Коментарі ({comments.length})
        </h3>

        {comments.length > 0 ? (
          <ul className="mb-4 space-y-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {c.authorName}
                  </span>
                  <time className="shrink-0 text-xs text-slate-400">
                    {formatCommentDate(c.createdAt)}
                  </time>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-slate-400">
            Поки немає коментарів. Будьте першим!
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Ваше ім'я"
            maxLength={100}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Напишіть коментар..."
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !authorName.trim() || !body.trim()}
            className={accentBtn}
          >
            {submitting ? "Надсилання..." : "Надіслати"}
          </button>
        </form>
      </div>
    </section>
  );
}
