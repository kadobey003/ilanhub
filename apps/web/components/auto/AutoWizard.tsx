"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AUTO_BRANDS,
  AutoStep,
  MIN_AUTO_DESCRIPTION,
  MIN_AUTO_PHOTOS,
  MAX_AUTO_PHOTOS,
  buildAutoTitle,
  formatAddonUah,
  formatAmountUah,
  formatAutoPreview,
  type ApiCategory,
  type ApiCity,
  type ApiVacancyType,
  type BotVehicle,
  type VehicleFuel,
  type VehicleTransmission,
} from "@ilanhub/shared";
import { getToken, isLoggedIn } from "@/lib/auth";
import {
  autoWatermarkTitle,
  createAutoListing,
  fetchAutoCategories,
  fetchAutoProjectId,
  fetchProjectAddons,
  fetchProjectCities,
  fetchVacancyTypes,
  uploadAutoPhoto,
  type ProjectAddon,
} from "@/lib/auto-api";
import { compressImageFile } from "@/lib/compress-image";

const INPUT =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";
const BTN =
  "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";
const BTN_OUT =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50";

const STEPS: AutoStep[] = [
  AutoStep.SELECT_CATEGORY,
  AutoStep.SELECT_CITY,
  AutoStep.BRAND,
  AutoStep.MODEL,
  AutoStep.YEAR,
  AutoStep.MILEAGE,
  AutoStep.FUEL,
  AutoStep.TRANSMISSION,
  AutoStep.COLOR,
  AutoStep.SALE_PRICE,
  AutoStep.DESCRIPTION,
  AutoStep.UPLOAD_PHOTOS,
  AutoStep.CONTACT,
  AutoStep.PIN_POST,
  AutoStep.SCHEDULE_POST,
  AutoStep.DAILY_DUPLICATE,
  AutoStep.PREVIEW,
];

function addonPrice(rows: ProjectAddon[], slug: string, fallback: number) {
  const row = rows.find((r) => r.slug === slug && r.isActive);
  return row?.price ?? fallback;
}

export function AutoWizard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AutoStep>(AutoStep.SELECT_CATEGORY);

  const [projectId, setProjectId] = useState("");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [bundles, setBundles] = useState<ApiVacancyType[]>([]);
  const [addons, setAddons] = useState<ProjectAddon[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [vehicle, setVehicle] = useState<Partial<BotVehicle>>({
    condition: "used",
    fuelType: "petrol",
    transmission: "manual",
  });
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pinPost, setPinPost] = useState(false);
  const [dailyDuplicate, setDailyDuplicate] = useState(false);
  const [scheduledPostAt, setScheduledPostAt] = useState("");

  const [draftBrand, setDraftBrand] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [draftYear, setDraftYear] = useState("");
  const [draftMileage, setDraftMileage] = useState("");
  const [draftColor, setDraftColor] = useState("");
  const [draftPrice, setDraftPrice] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?from=create&project=auto");
      return;
    }
    (async () => {
      try {
        const pid = await fetchAutoProjectId();
        if (!pid) throw new Error("Project not found");
        const [cats, cityRows, bundleRows, addonRows] = await Promise.all([
          fetchAutoCategories(pid),
          fetchProjectCities(pid),
          fetchVacancyTypes(pid),
          fetchProjectAddons(pid),
        ]);
        setProjectId(pid);
        setCategories(cats);
        setCities(cityRows);
        setBundles(bundleRows);
        setAddons(addonRows);
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Помилка завантаження");
      }
    })();
  }, [router]);

  const bundle = bundles.find((b) => b.vacancyCount === 1);
  const pinPrice = addonPrice(addons, "pin", 199);
  const dailyPrice = addonPrice(addons, "daily_duplicate", 99);
  const totalPrice = useMemo(() => {
    let t = bundle?.price ?? 0;
    if (pinPost) t += pinPrice;
    if (dailyDuplicate) t += dailyPrice;
    return t;
  }, [bundle, pinPost, dailyDuplicate, pinPrice, dailyPrice]);

  const fullVehicle = useMemo((): BotVehicle | null => {
    if (
      !vehicle.brand ||
      !vehicle.model ||
      !vehicle.year ||
      vehicle.mileage == null ||
      !vehicle.fuelType ||
      !vehicle.transmission ||
      !vehicle.salePrice
    ) {
      return null;
    }
    return vehicle as BotVehicle;
  }, [vehicle]);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]!);
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]!);
    setError("");
  }, [step]);

  const handlePhotos = async (files: FileList | null) => {
    if (!files?.length || !fullVehicle) return;
    setPhotoUploading(true);
    setError("");
    const wm = autoWatermarkTitle(fullVehicle);
    try {
      for (const file of Array.from(files)) {
        if (mediaUrls.length >= MAX_AUTO_PHOTOS) break;
        const compressed = await compressImageFile(file);
        const { url } = await uploadAutoPhoto(compressed, wm);
        setMediaUrls((prev) => [...prev, url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження фото");
    } finally {
      setPhotoUploading(false);
    }
  };

  const submit = async () => {
    if (!getToken() || !fullVehicle || !categoryId || !cityId) return;
    setLoading(true);
    setError("");
    try {
      const res = await createAutoListing({
        projectId,
        categoryId,
        cityId,
        description,
        pinPost,
        dailyDuplicate,
        scheduledPostAt: scheduledPostAt || undefined,
        contactPhone,
        listingPrice: totalPrice,
        bundlePriceId: bundle?.id,
        mediaUrls,
        vehicle: fullVehicle,
      });
      router.push(`/account/listings?created=${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка відправки");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Завантаження…</p>;
  }

  const previewBody =
    fullVehicle &&
    formatAutoPreview(
      {
        title: buildAutoTitle(fullVehicle),
        vehicle: fullVehicle,
        city: cities.find((c) => c.id === cityId)?.name,
        description,
        contactPhone,
        siteUrl: "https://ilanhub.com/auto",
      },
      [`Загальна вартість: ${formatAmountUah(totalPrice)}`],
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-medium text-emerald-700">
          Крок {STEPS.indexOf(step) + 1} / {STEPS.length}
        </span>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {step === AutoStep.SELECT_CATEGORY && (
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                categoryId === c.id
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 hover:border-emerald-300"
              }`}
              onClick={() => {
                setCategoryId(c.id);
                goNext();
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {step === AutoStep.SELECT_CITY && (
        <div className="grid gap-2 sm:grid-cols-2">
          {cities.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                cityId === c.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-emerald-300"
              }`}
              onClick={() => {
                setCityId(c.id);
                goNext();
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {step === AutoStep.BRAND && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {AUTO_BRANDS.map((b) => (
              <button
                key={b}
                type="button"
                className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                onClick={() => {
                  setDraftBrand(b);
                  setVehicle((v) => ({ ...v, brand: b }));
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <input
            className={INPUT}
            placeholder="Марка"
            value={draftBrand}
            onChange={(e) => setDraftBrand(e.target.value)}
          />
          <button
            type="button"
            className={BTN}
            disabled={!draftBrand.trim()}
            onClick={() => {
              setVehicle((v) => ({ ...v, brand: draftBrand.trim() }));
              goNext();
            }}
          >
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.MODEL && (
        <div className="space-y-3">
          <input
            className={INPUT}
            placeholder="Модель"
            value={draftModel}
            onChange={(e) => setDraftModel(e.target.value)}
          />
          <button
            type="button"
            className={BTN}
            disabled={!draftModel.trim()}
            onClick={() => {
              setVehicle((v) => ({ ...v, model: draftModel.trim() }));
              goNext();
            }}
          >
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.YEAR && (
        <div className="space-y-3">
          <input
            className={INPUT}
            type="number"
            placeholder="Рік (2018)"
            value={draftYear}
            onChange={(e) => setDraftYear(e.target.value)}
          />
          <button
            type="button"
            className={BTN}
            onClick={() => {
              const y = Number(draftYear);
              if (y < 1980 || y > 2030) {
                setError("Невірний рік");
                return;
              }
              setVehicle((v) => ({ ...v, year: y }));
              goNext();
            }}
          >
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.MILEAGE && (
        <div className="space-y-3">
          <input
            className={INPUT}
            type="number"
            placeholder="Пробіг (км)"
            value={draftMileage}
            onChange={(e) => setDraftMileage(e.target.value)}
          />
          <button
            type="button"
            className={BTN}
            onClick={() => {
              const m = Number(draftMileage);
              if (!Number.isFinite(m) || m < 0) {
                setError("Невірний пробіг");
                return;
              }
              setVehicle((v) => ({ ...v, mileage: m }));
              goNext();
            }}
          >
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.FUEL && (
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["petrol", "Бензин"],
              ["diesel", "Дизель"],
              ["gas", "Газ"],
              ["hybrid", "Гібрид"],
              ["electric", "Електро"],
            ] as [VehicleFuel, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium hover:border-emerald-400"
              onClick={() => {
                setVehicle((v) => ({ ...v, fuelType: id }));
                goNext();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {step === AutoStep.TRANSMISSION && (
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["manual", "Механіка"],
              ["automatic", "Автомат"],
            ] as [VehicleTransmission, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium hover:border-emerald-400"
              onClick={() => {
                setVehicle((v) => ({ ...v, transmission: id }));
                goNext();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {step === AutoStep.COLOR && (
        <div className="space-y-3">
          <input
            className={INPUT}
            placeholder="Колір (необовʼязково)"
            value={draftColor}
            onChange={(e) => setDraftColor(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className={BTN_OUT} onClick={goNext}>
              Пропустити
            </button>
            <button
              type="button"
              className={BTN}
              onClick={() => {
                setVehicle((v) => ({ ...v, color: draftColor.trim() || undefined }));
                goNext();
              }}
            >
              Далі
            </button>
          </div>
        </div>
      )}

      {step === AutoStep.SALE_PRICE && (
        <div className="space-y-3">
          <input
            className={INPUT}
            type="number"
            placeholder="Ціна (₴)"
            value={draftPrice}
            onChange={(e) => setDraftPrice(e.target.value)}
          />
          <button
            type="button"
            className={BTN}
            onClick={() => {
              const p = Number(draftPrice);
              if (!Number.isFinite(p) || p < 1) {
                setError("Невірна ціна");
                return;
              }
              setVehicle((v) => ({ ...v, salePrice: p }));
              goNext();
            }}
          >
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.DESCRIPTION && (
        <div className="space-y-3">
          <textarea
            className={`${INPUT} min-h-[160px]`}
            placeholder={`Детальний опис (мін. ${MIN_AUTO_DESCRIPTION} символів)`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-slate-400">{description.length} / {MIN_AUTO_DESCRIPTION}+</p>
          <button
            type="button"
            className={BTN}
            disabled={description.length < MIN_AUTO_DESCRIPTION}
            onClick={goNext}
          >
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.UPLOAD_PHOTOS && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Завантажте від {MIN_AUTO_PHOTOS} до {MAX_AUTO_PHOTOS} фото. На кожне фото
            автоматично накладається водяний знак.
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={photoUploading || mediaUrls.length >= MAX_AUTO_PHOTOS}
            onChange={(e) => handlePhotos(e.target.files)}
          />
          {photoUploading && <p className="text-sm text-slate-500">Завантаження…</p>}
          <div className="grid grid-cols-4 gap-2">
            {mediaUrls.map((url, i) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/50 px-1 text-xs text-white"
                  onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">{mediaUrls.length} / {MAX_AUTO_PHOTOS}</p>
          <button
            type="button"
            className={BTN}
            disabled={mediaUrls.length < MIN_AUTO_PHOTOS}
            onClick={goNext}
          >
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.CONTACT && (
        <div className="space-y-3">
          <input
            className={INPUT}
            placeholder="+380..."
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          <button type="button" className={BTN} disabled={!contactPhone.trim()} onClick={goNext}>
            Далі
          </button>
        </div>
      )}

      {step === AutoStep.PIN_POST && (
        <div className="space-y-3">
          <p className="text-sm">Закріпити в каналі? {formatAddonUah(pinPrice)}</p>
          <div className="flex gap-2">
            <button type="button" className={BTN} onClick={() => { setPinPost(true); goNext(); }}>
              Так
            </button>
            <button type="button" className={BTN_OUT} onClick={() => { setPinPost(false); goNext(); }}>
              Ні
            </button>
          </div>
        </div>
      )}

      {step === AutoStep.SCHEDULE_POST && (
        <div className="space-y-3">
          <input
            className={INPUT}
            placeholder="ДД.ММ.РР ГГ:ХХ"
            value={scheduledPostAt}
            onChange={(e) => setScheduledPostAt(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className={BTN_OUT} onClick={goNext}>
              Зараз
            </button>
            <button type="button" className={BTN} onClick={goNext}>
              Далі
            </button>
          </div>
        </div>
      )}

      {step === AutoStep.DAILY_DUPLICATE && (
        <div className="space-y-3">
          <p className="text-sm">Щоденне дублювання? {formatAddonUah(dailyPrice)}</p>
          <div className="flex gap-2">
            <button type="button" className={BTN} onClick={() => { setDailyDuplicate(true); goNext(); }}>
              Так
            </button>
            <button type="button" className={BTN_OUT} onClick={() => { setDailyDuplicate(false); goNext(); }}>
              Ні
            </button>
          </div>
        </div>
      )}

      {step === AutoStep.PREVIEW && previewBody && (
        <div className="space-y-4">
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
            {previewBody}
          </pre>
          <button type="button" className={BTN} disabled={loading} onClick={submit}>
            {loading ? "Відправка…" : `Підтвердити · ${formatAmountUah(totalPrice)}`}
          </button>
        </div>
      )}

      <div className="flex justify-between border-t border-slate-100 pt-4">
        {STEPS.indexOf(step) > 0 ? (
          <button type="button" className={BTN_OUT} onClick={goBack}>
            Назад
          </button>
        ) : (
          <Link href="/avto" className={BTN_OUT}>
            Скасувати
          </Link>
        )}
      </div>
    </div>
  );
}
