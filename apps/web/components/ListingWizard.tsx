"use client";

import { useEffect, useState } from "react";
import { ListingState, LISTING_STATE_ORDER } from "@ilanhub/shared";
import type { ApiCategory, ApiCity, ApiProject } from "@ilanhub/shared";
import { i18n, stepLabel } from "@ilanhub/i18n";
import {
  fetchActiveProjects,
  fetchProjectCategories,
  fetchProjectCities,
} from "@/lib/catalog-api";

const STEPS = LISTING_STATE_ORDER.slice(0, 7);

const PROJECT_META: Record<string, { emoji: string }> = {
  horeca: { emoji: "🍽️" },
  jobs: { emoji: "💼" },
  auto: { emoji: "🚗" },
};

function OptionGrid<T extends { id: string; name: string }>({
  items,
  selectedId,
  onSelect,
  renderMeta,
}: {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderMeta?: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Немає доступних варіантів</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              selected
                ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {renderMeta?.(item)}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.name}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ListingWizard({
  initialProjectSlug,
}: {
  initialProjectSlug?: string;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    projectId: "",
    categoryId: "",
    cityId: "",
    title: "",
    description: "",
    price: "",
  });
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchActiveProjects();
        if (cancelled) return;
        setProjects(data);
        if (initialProjectSlug) {
          const match = data.find((p) => p.slug === initialProjectSlug);
          if (match) setForm((f) => ({ ...f, projectId: match.id }));
        }
      } catch {
        if (!cancelled) setLoadError("Не вдалося завантажити проєкти");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialProjectSlug]);

  useEffect(() => {
    if (!form.projectId) {
      setCategories([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProjectCategories(form.projectId);
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.projectId]);

  useEffect(() => {
    if (!form.projectId) {
      setCities([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProjectCities(form.projectId);
        if (!cancelled) setCities(data);
      } catch {
        if (!cancelled) setCities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.projectId]);

  const canAdvance = () => {
    if (current === ListingState.SELECT_PROJECT) return Boolean(form.projectId);
    if (current === ListingState.SELECT_CATEGORY) return Boolean(form.categoryId);
    if (current === ListingState.SELECT_CITY) return Boolean(form.cityId);
    if (current === ListingState.ENTER_DETAILS) {
      return Boolean(form.title.trim() && form.description.trim());
    }
    return true;
  };

  const next = () => {
    if (!canAdvance()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) || 0, channel: "web" }),
    });
    setStep(STEPS.length);
  };

  if (step >= STEPS.length) {
    return <p className="text-green-600 font-medium">{i18n.bot.submitted}</p>;
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">{stepLabel(step + 1)}</p>

      {loadError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {loadError}
        </p>
      )}

      {current === ListingState.SELECT_PROJECT && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {i18n.bot.selectProject}
          </p>
          {loading ? (
            <p className="text-sm text-slate-400">Завантаження…</p>
          ) : (
            <OptionGrid
              items={projects}
              selectedId={form.projectId}
              onSelect={(projectId) => {
                const picked = projects.find((p) => p.id === projectId);
                if (picked?.slug === "horeca") {
                  window.location.href = "/create?project=horeca";
                  return;
                }
                setForm((f) => ({
                  ...f,
                  projectId,
                  categoryId: "",
                  cityId: "",
                }));
              }}
              renderMeta={(item) => (
                <span className="text-2xl leading-none">
                  {PROJECT_META[item.slug]?.emoji ?? "📋"}
                </span>
              )}
            />
          )}
        </div>
      )}

      {current === ListingState.SELECT_CATEGORY && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {i18n.bot.selectCategory}
          </p>
          <OptionGrid
            items={categories}
            selectedId={form.categoryId}
            onSelect={(categoryId) =>
              setForm((f) => ({ ...f, categoryId }))
            }
          />
        </div>
      )}

      {current === ListingState.SELECT_CITY && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {i18n.bot.selectCity}
          </p>
          <OptionGrid
            items={cities}
            selectedId={form.cityId}
            onSelect={(cityId) => setForm((f) => ({ ...f, cityId }))}
          />
        </div>
      )}

      {current === ListingState.ENTER_DETAILS && (
        <div className="space-y-3">
          <input
            className={inputClass}
            placeholder={i18n.bot.enterTitle}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className={inputClass}
            placeholder={i18n.bot.enterDescription}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder={i18n.bot.enterPrice}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
      )}

      {current === ListingState.CONFIRM_PREVIEW && (
        <div className="mb-4 rounded-xl bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">{form.title}</p>
          <p className="mt-2 text-slate-600 whitespace-pre-wrap">{form.description}</p>
          <p className="text-brand font-bold mt-3">{form.price || 0} ₴</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50"
          >
            {i18n.bot.back}
          </button>
        )}
        {isLast ? (
          <button
            type="button"
            onClick={submit}
            className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark"
          >
            {i18n.bot.confirm}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance()}
            className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50"
          >
            Далі
          </button>
        )}
      </div>
    </div>
  );
}
