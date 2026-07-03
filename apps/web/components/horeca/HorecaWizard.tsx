"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HorecaStep,
  formatAddonUah,
  formatAmountUah,
  formatHorecaPreview,
  type ApiCity,
  type ApiVacancyType,
  type BotPosition,
} from "@ilanhub/shared";
import { i18n, t } from "@ilanhub/i18n";
import { getToken, getUser, isLoggedIn } from "@/lib/auth";
import {
  createHorecaListing,
  fetchHorecaCategory,
  fetchHorecaProjectId,
  fetchProjectAddons,
  fetchProjectCities,
  fetchVacancyTypes,
  uploadListingPhoto,
  type ProjectAddon,
} from "@/lib/horeca-api";
import { compressImageFile } from "@/lib/compress-image";

const MAX_VACANCIES = 3;

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50";

const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50";

function mapPositionToApi(v: BotPosition) {
  const hours = [v.schedule, v.workTime].filter(Boolean).join(", ");
  const descParts = [
    v.experience ? `Досвід: ${v.experience}` : "",
    v.description ?? "",
  ].filter(Boolean);
  return {
    title: v.title,
    salary: v.salary,
    workingHours: hours || v.workingHours,
    description: descParts.join("\n") || undefined,
  };
}

function parseScheduleDate(text: string): boolean {
  return /^\d{2}\.\d{2}\.\d{2,4}\s+\d{1,2}:\d{2}$/.test(text.trim());
}

function addonPrice(
  rows: ProjectAddon[],
  slug: string,
  fallback: number,
  vacancyCount = 1,
): number {
  const row = rows.find((r) => r.slug === slug && r.isActive);
  if (!row) return fallback;
  return row.billingUnit === "per_vacancy" ? row.price * vacancyCount : row.price;
}

function OptionGrid<T extends { id: string; name: string }>({
  items,
  selectedId,
  onSelect,
}: {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              selected
                ? "border-brand bg-brand/5 ring-2 ring-brand/20 text-slate-900"
                : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

export function HorecaWizard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<HorecaStep>(HorecaStep.SELECT_CITY);

  const [projectId, setProjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [bundles, setBundles] = useState<ApiVacancyType[]>([]);
  const [addons, setAddons] = useState<ProjectAddon[]>([]);

  const [cityId, setCityId] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [vacancyCount, setVacancyCount] = useState(1);
  const [vacancyIndex, setVacancyIndex] = useState(0);
  const [vacancies, setVacancies] = useState<BotPosition[]>([]);
  const [bundlePriceId, setBundlePriceId] = useState<string>();
  const [bundlePrice, setBundlePrice] = useState(0);

  const [draftVacancy, setDraftVacancy] = useState<BotPosition>({ title: "" });
  const [benefits, setBenefits] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pinPost, setPinPost] = useState(false);
  const [scheduledPostAt, setScheduledPostAt] = useState<string>();
  const [dailyDuplicate, setDailyDuplicate] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const userPhone = getUser()?.phone ?? "";

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?from=/create?project=horeca");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const pid = await fetchHorecaProjectId();
        if (!pid || cancelled) return;
        const [category, cityRows, bundleRows, addonRows] = await Promise.all([
          fetchHorecaCategory(pid),
          fetchProjectCities(pid),
          fetchVacancyTypes(pid),
          fetchProjectAddons(pid),
        ]);
        if (cancelled) return;
        setProjectId(pid);
        setCategoryId(category.id);
        setCities(cityRows);
        setBundles(bundleRows);
        setAddons(addonRows);
        if (userPhone) setContactPhone(userPhone);
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : i18n.bot.error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, userPhone]);

  const pinPrice = useMemo(
    () => addonPrice(addons, "pin", 500),
    [addons],
  );
  const dailyPrice = useMemo(
    () => addonPrice(addons, "daily_duplicate", 150, vacancyCount),
    [addons, vacancyCount],
  );

  const totalPrice = useMemo(() => {
    let total = bundlePrice;
    if (pinPost) total += pinPrice;
    if (dailyDuplicate) total += dailyPrice;
    return total;
  }, [bundlePrice, pinPost, dailyDuplicate, pinPrice, dailyPrice]);

  const vacancyLabel = vacancies[vacancyIndex]?.title ?? draftVacancy.title ?? "";

  const applyVacancyCount = useCallback(
    (count: number) => {
      const bundle = bundles.find((b) => b.vacancyCount === count);
      setVacancyCount(count);
      setVacancyIndex(0);
      setVacancies([]);
      setDraftVacancy({ title: "" });
      setBundlePrice(bundle?.price ?? 0);
      setBundlePriceId(bundle?.id);
      setStep(HorecaStep.VACANCY_TITLE);
    },
    [bundles],
  );

  const finishVacancyBlock = useCallback(() => {
    if (vacancyIndex + 1 < vacancyCount) {
      setVacancyIndex((i) => i + 1);
      setDraftVacancy({ title: "" });
      setStep(HorecaStep.VACANCY_TITLE);
    } else {
      setStep(HorecaStep.BENEFITS);
    }
  }, [vacancyCount, vacancyIndex]);

  const saveCurrentVacancyField = (patch: Partial<BotPosition>) => {
    setDraftVacancy((prev) => ({ ...prev, ...patch }));
  };

  const commitVacancyTitle = () => {
    const entry = { title: draftVacancy.title.trim() };
    const next = [...vacancies];
    next[vacancyIndex] = entry;
    setVacancies(next);
    setDraftVacancy(entry);
    setStep(HorecaStep.VACANCY_EXPERIENCE);
  };

  const commitVacancyAndAdvance = (patch: Partial<BotPosition>, next: HorecaStep) => {
    const nextVacancies = [...vacancies];
    nextVacancies[vacancyIndex] = { ...nextVacancies[vacancyIndex], ...patch };
    setVacancies(nextVacancies);
    setDraftVacancy(nextVacancies[vacancyIndex] ?? { title: "" });
    setStep(next);
  };

  const previewText = useMemo(() => {
    const adminFooter: string[] = [
      t("bot.horeca.basePrice", { price: formatAmountUah(bundlePrice) }),
    ];
    if (pinPost) {
      adminFooter.push(
        t("bot.horeca.addonPin", { price: formatAddonUah(pinPrice) }),
      );
    }
    if (dailyDuplicate) {
      adminFooter.push(
        t("bot.horeca.addonDaily", { price: formatAddonUah(dailyPrice) }),
      );
    }
    adminFooter.push(
      t("bot.horeca.totalPrice", { price: formatAmountUah(totalPrice) }),
    );
    if (scheduledPostAt) {
      adminFooter.push(`📅 Публікація: ${scheduledPostAt}`);
    }

    return formatHorecaPreview(
      {
        businessType,
        title,
        address,
        benefits: benefits || undefined,
        contactPhone,
        positions: vacancies,
      },
      adminFooter,
    );
  }, [
    address,
    benefits,
    bundlePrice,
    businessType,
    contactPhone,
    dailyDuplicate,
    dailyPrice,
    pinPost,
    pinPrice,
    scheduledPostAt,
    title,
    totalPrice,
    vacancies,
  ]);

  const stepPrompt = useMemo(() => {
    switch (step) {
      case HorecaStep.SELECT_CITY:
        return `${i18n.bot.horeca.intro}\n\n${i18n.bot.horeca.selectCity}`;
      case HorecaStep.BUSINESS_TYPE:
        return i18n.bot.horeca.businessType;
      case HorecaStep.BUSINESS_NAME:
        return i18n.bot.horeca.businessName;
      case HorecaStep.ADDRESS:
        return i18n.bot.horeca.address;
      case HorecaStep.VACANCY_COUNT:
        return i18n.bot.horeca.vacancyCount;
      case HorecaStep.VACANCY_TITLE:
        return t("bot.horeca.vacancyTitle", {
          n: vacancyIndex + 1,
          total: vacancyCount,
        });
      case HorecaStep.VACANCY_EXPERIENCE:
        return t("bot.horeca.vacancyExperience", { title: vacancyLabel });
      case HorecaStep.VACANCY_SALARY:
        return t("bot.horeca.vacancySalary", { title: vacancyLabel });
      case HorecaStep.VACANCY_SCHEDULE:
        return t("bot.horeca.vacancySchedule", { title: vacancyLabel });
      case HorecaStep.VACANCY_TIME:
        return t("bot.horeca.vacancyTime", { title: vacancyLabel });
      case HorecaStep.VACANCY_DESCRIPTION:
        return t("bot.horeca.vacancyDescription", { title: vacancyLabel });
      case HorecaStep.BENEFITS:
        return i18n.bot.horeca.benefits;
      case HorecaStep.CONTACT:
        return i18n.bot.horeca.contact;
      case HorecaStep.UPLOAD_PHOTOS:
        return i18n.bot.horeca.uploadPhotos;
      case HorecaStep.PIN_POST:
        return t("bot.horeca.pinPost", { price: formatAddonUah(pinPrice) });
      case HorecaStep.SCHEDULE_POST:
        return i18n.bot.horeca.schedulePost;
      case HorecaStep.DAILY_DUPLICATE:
        return t("bot.horeca.dailyDuplicate", { price: formatAddonUah(dailyPrice) });
      case HorecaStep.PREVIEW:
        return i18n.bot.horeca.preview;
      default:
        return "";
    }
  }, [dailyPrice, pinPrice, step, vacancyCount, vacancyIndex, vacancyLabel]);

  const goBack = () => {
    setError("");
    const order: HorecaStep[] = [
      HorecaStep.SELECT_CITY,
      HorecaStep.BUSINESS_TYPE,
      HorecaStep.BUSINESS_NAME,
      HorecaStep.ADDRESS,
      HorecaStep.VACANCY_COUNT,
      HorecaStep.VACANCY_TITLE,
      HorecaStep.VACANCY_EXPERIENCE,
      HorecaStep.VACANCY_SALARY,
      HorecaStep.VACANCY_SCHEDULE,
      HorecaStep.VACANCY_TIME,
      HorecaStep.VACANCY_DESCRIPTION,
      HorecaStep.BENEFITS,
      HorecaStep.CONTACT,
      HorecaStep.UPLOAD_PHOTOS,
      HorecaStep.PIN_POST,
      HorecaStep.SCHEDULE_POST,
      HorecaStep.DAILY_DUPLICATE,
      HorecaStep.PREVIEW,
    ];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]!);
  };

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    setMediaUrl(null);
    try {
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed);
      const { url } = await uploadListingPhoto(compressed);
      setMediaUrl(url);
    } catch (err) {
      setPhotoPreview(null);
      setMediaUrl(null);
      const msg = err instanceof Error ? err.message : i18n.bot.error;
      setError(
        msg.toLowerCase().includes("too large")
          ? "Фото занадто велике. Спробуйте інше зображення."
          : msg,
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const submit = async () => {
    if (!getToken() || !mediaUrl) return;
    setLoading(true);
    setError("");
    try {
      const res = await createHorecaListing({
        projectId,
        categoryId,
        cityId,
        businessType,
        title,
        address,
        benefits: benefits || undefined,
        pinPost,
        dailyDuplicate,
        scheduledPostAt,
        contactPhone,
        listingPrice: totalPrice,
        bundlePriceId,
        mediaUrls: [mediaUrl],
        positions: vacancies.map(mapPositionToApi),
      });
      setSubmittedId(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.bot.error);
    } finally {
      setLoading(false);
    }
  };

  if (!ready && !error) {
    return <p className="text-sm text-slate-400">{i18n.common.loading}</p>;
  }

  if (submittedId) {
    return (
      <div className="space-y-4">
        <p className="font-medium text-green-600">
          {i18n.bot.listing_submitted.replace("{{id}}", submittedId.slice(0, 8))}
        </p>
        <Link href="/account/listings" className={`${BTN_PRIMARY} w-full`}>
          Мої оголошення
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <p className="whitespace-pre-line text-sm text-slate-600">{stepPrompt}</p>

      {step === HorecaStep.SELECT_CITY && (
        <OptionGrid items={cities} selectedId={cityId} onSelect={setCityId} />
      )}

      {step === HorecaStep.BUSINESS_TYPE && (
        <input
          className={INPUT_CLASS}
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="Ресторан, бар, кафе…"
        />
      )}

      {step === HorecaStep.BUSINESS_NAME && (
        <input
          className={INPUT_CLASS}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Назва закладу"
        />
      )}

      {step === HorecaStep.ADDRESS && (
        <input
          className={INPUT_CLASS}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Адреса"
        />
      )}

      {step === HorecaStep.VACANCY_COUNT && (
        <div className="grid gap-3">
          {bundles.map((bundle) => (
            <button
              key={bundle.id}
              type="button"
              onClick={() => applyVacancyCount(bundle.vacancyCount)}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-brand hover:bg-brand/5"
            >
              <span className="font-medium text-slate-900">{bundle.name}</span>
              <span className="text-brand font-semibold">
                {formatAmountUah(bundle.price)}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === HorecaStep.VACANCY_TITLE && (
        <input
          className={INPUT_CLASS}
          value={draftVacancy.title}
          onChange={(e) => saveCurrentVacancyField({ title: e.target.value })}
          placeholder="Кухар, офіціант…"
        />
      )}

      {step === HorecaStep.VACANCY_EXPERIENCE && (
        <input
          className={INPUT_CLASS}
          value={draftVacancy.experience ?? ""}
          onChange={(e) => saveCurrentVacancyField({ experience: e.target.value })}
        />
      )}

      {step === HorecaStep.VACANCY_SALARY && (
        <input
          className={INPUT_CLASS}
          value={draftVacancy.salary ?? ""}
          onChange={(e) => saveCurrentVacancyField({ salary: e.target.value })}
        />
      )}

      {step === HorecaStep.VACANCY_SCHEDULE && (
        <input
          className={INPUT_CLASS}
          value={draftVacancy.schedule ?? ""}
          onChange={(e) => saveCurrentVacancyField({ schedule: e.target.value })}
        />
      )}

      {step === HorecaStep.VACANCY_TIME && (
        <input
          className={INPUT_CLASS}
          value={draftVacancy.workTime ?? ""}
          onChange={(e) => saveCurrentVacancyField({ workTime: e.target.value })}
        />
      )}

      {step === HorecaStep.VACANCY_DESCRIPTION && (
        <textarea
          className={INPUT_CLASS}
          rows={4}
          value={draftVacancy.description ?? ""}
          onChange={(e) => saveCurrentVacancyField({ description: e.target.value })}
        />
      )}

      {step === HorecaStep.BENEFITS && (
        <textarea
          className={INPUT_CLASS}
          rows={5}
          value={benefits}
          onChange={(e) => setBenefits(e.target.value)}
        />
      )}

      {step === HorecaStep.CONTACT && (
        <input
          className={INPUT_CLASS}
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="+380…"
        />
      )}

      {step === HorecaStep.UPLOAD_PHOTOS && (
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            disabled={photoUploading}
            onChange={(e) => void handlePhoto(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600"
          />
          {photoUploading && (
            <p className="text-sm text-slate-500">{i18n.common.loading}</p>
          )}
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Превʼю"
              className="max-h-48 rounded-xl border border-slate-200 object-cover"
            />
          )}
          {mediaUrl && !photoUploading && (
            <p className="text-sm text-green-600">{i18n.bot.horeca.photoAdded}</p>
          )}
        </div>
      )}

      {(step === HorecaStep.PIN_POST || step === HorecaStep.DAILY_DUPLICATE) && (
        <div className="flex gap-3">
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => {
              if (step === HorecaStep.PIN_POST) {
                setPinPost(true);
                setStep(HorecaStep.SCHEDULE_POST);
              } else {
                setDailyDuplicate(true);
                setStep(HorecaStep.PREVIEW);
              }
            }}
          >
            {i18n.common.yes}
          </button>
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={() => {
              if (step === HorecaStep.PIN_POST) {
                setPinPost(false);
                setStep(HorecaStep.SCHEDULE_POST);
              } else {
                setDailyDuplicate(false);
                setStep(HorecaStep.PREVIEW);
              }
            }}
          >
            {i18n.common.no}
          </button>
        </div>
      )}

      {step === HorecaStep.SCHEDULE_POST && (
        <div className="space-y-3">
          <input
            className={INPUT_CLASS}
            value={scheduledPostAt ?? ""}
            onChange={(e) => setScheduledPostAt(e.target.value)}
            placeholder="09.06.26 12:00"
          />
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={() => {
              setScheduledPostAt(undefined);
              setStep(HorecaStep.DAILY_DUPLICATE);
            }}
          >
            Пропустити
          </button>
        </div>
      )}

      {step === HorecaStep.PREVIEW && (
        <div className="space-y-4">
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Фото"
              className="w-full max-h-56 rounded-xl object-cover border border-slate-200"
            />
          )}
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
            {previewText}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {step !== HorecaStep.SELECT_CITY && (
          <button type="button" className={BTN_SECONDARY} onClick={goBack}>
            {i18n.bot.back}
          </button>
        )}

        {step === HorecaStep.SELECT_CITY && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!cityId}
            onClick={() => setStep(HorecaStep.BUSINESS_TYPE)}
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.BUSINESS_TYPE && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!businessType.trim()}
            onClick={() => setStep(HorecaStep.BUSINESS_NAME)}
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.BUSINESS_NAME && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!title.trim()}
            onClick={() => setStep(HorecaStep.ADDRESS)}
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.ADDRESS && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!address.trim()}
            onClick={() => setStep(HorecaStep.VACANCY_COUNT)}
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.VACANCY_TITLE && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!draftVacancy.title.trim()}
            onClick={commitVacancyTitle}
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.VACANCY_EXPERIENCE && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!draftVacancy.experience?.trim()}
            onClick={() =>
              commitVacancyAndAdvance(
                { experience: draftVacancy.experience },
                HorecaStep.VACANCY_SALARY,
              )
            }
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.VACANCY_SALARY && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!draftVacancy.salary?.trim()}
            onClick={() =>
              commitVacancyAndAdvance(
                { salary: draftVacancy.salary },
                HorecaStep.VACANCY_SCHEDULE,
              )
            }
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.VACANCY_SCHEDULE && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!draftVacancy.schedule?.trim()}
            onClick={() =>
              commitVacancyAndAdvance(
                { schedule: draftVacancy.schedule },
                HorecaStep.VACANCY_TIME,
              )
            }
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.VACANCY_TIME && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!draftVacancy.workTime?.trim()}
            onClick={() =>
              commitVacancyAndAdvance(
                { workTime: draftVacancy.workTime },
                HorecaStep.VACANCY_DESCRIPTION,
              )
            }
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.VACANCY_DESCRIPTION && (
          <>
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => {
                const nextVacancies = [...vacancies];
                nextVacancies[vacancyIndex] = {
                  ...nextVacancies[vacancyIndex],
                  description: undefined,
                };
                setVacancies(nextVacancies);
                finishVacancyBlock();
              }}
            >
              Пропустити
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => {
                const desc = draftVacancy.description?.trim();
                const nextVacancies = [...vacancies];
                nextVacancies[vacancyIndex] = {
                  ...nextVacancies[vacancyIndex],
                  description: desc || undefined,
                };
                setVacancies(nextVacancies);
                finishVacancyBlock();
              }}
            >
              {i18n.common.next}
            </button>
          </>
        )}

        {step === HorecaStep.BENEFITS && (
          <>
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => {
                setBenefits("");
                setStep(HorecaStep.CONTACT);
              }}
            >
              Пропустити
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setStep(HorecaStep.CONTACT)}
            >
              {i18n.common.next}
            </button>
          </>
        )}

        {step === HorecaStep.CONTACT && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!contactPhone.trim()}
            onClick={() => setStep(HorecaStep.UPLOAD_PHOTOS)}
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.UPLOAD_PHOTOS && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!mediaUrl || photoUploading}
            onClick={() => setStep(HorecaStep.PIN_POST)}
          >
            {i18n.bot.horeca.photosDone}
          </button>
        )}

        {step === HorecaStep.SCHEDULE_POST && (
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => {
              if (scheduledPostAt && !parseScheduleDate(scheduledPostAt)) {
                setError(i18n.bot.horeca.invalidDate);
                return;
              }
              setError("");
              setStep(HorecaStep.DAILY_DUPLICATE);
            }}
          >
            {i18n.common.next}
          </button>
        )}

        {step === HorecaStep.PREVIEW && (
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={loading}
            onClick={submit}
          >
            {loading ? i18n.common.loading : i18n.bot.confirm}
          </button>
        )}
      </div>
    </div>
  );
}
