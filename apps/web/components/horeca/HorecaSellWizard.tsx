"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HorecaSellStep,
  formatAddonUah,
  formatAmountUah,
  formatHorecaProductPreview,
  type ApiCity,
  type ApiVacancyType,
  type BotProduct,
} from "@ilanhub/shared";
import { i18n, t } from "@ilanhub/i18n";
import { getToken, getUser, isLoggedIn } from "@/lib/auth";
import {
  createHorecaSellListing,
  fetchHorecaSellCategory,
  fetchHorecaProjectId,
  fetchProjectAddons,
  fetchProjectCities,
  fetchVacancyTypes,
  uploadListingPhoto,
  type ProjectAddon,
} from "@/lib/horeca-api";
import { compressImageFile } from "@/lib/compress-image";

const MAX_PRODUCTS = 3;
const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50";
const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50";

function mapProductToApi(p: BotProduct) {
  return {
    title: p.title,
    salary: p.price ? `💰 ${p.price}` : undefined,
    workingHours: p.condition ? `📦 Стан: ${p.condition}` : undefined,
    description: p.description || undefined,
  };
}

function addonPrice(rows: ProjectAddon[], slug: string, fallback: number, count = 1) {
  const row = rows.find((r) => r.slug === slug && r.isActive);
  if (!row) return fallback;
  return row.billingUnit === "per_vacancy" ? row.price * count : row.price;
}

export function HorecaSellWizard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<HorecaSellStep>(HorecaSellStep.SELECT_CITY);

  const [projectId, setProjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [bundles, setBundles] = useState<ApiVacancyType[]>([]);
  const [addons, setAddons] = useState<ProjectAddon[]>([]);

  const [cityId, setCityId] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [productCount, setProductCount] = useState(1);
  const [productIndex, setProductIndex] = useState(0);
  const [products, setProducts] = useState<BotProduct[]>([]);
  const [bundlePriceId, setBundlePriceId] = useState<string>();
  const [bundlePrice, setBundlePrice] = useState(0);
  const [draftProduct, setDraftProduct] = useState<BotProduct>({ title: "" });

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
      router.replace("/login?from=/create?project=horeca&mode=sell");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const pid = await fetchHorecaProjectId();
        if (!pid || cancelled) return;
        const [category, cityRows, bundleRows, addonRows] = await Promise.all([
          fetchHorecaSellCategory(pid),
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
        if (!cancelled) setError(err instanceof Error ? err.message : i18n.bot.error);
      }
    })();
    return () => { cancelled = true; };
  }, [router, userPhone]);

  const pinPrice = useMemo(() => addonPrice(addons, "pin", 500), [addons]);
  const dailyPrice = useMemo(
    () => addonPrice(addons, "daily_duplicate", 150, productCount),
    [addons, productCount],
  );
  const totalPrice = useMemo(() => {
    let total = bundlePrice;
    if (pinPost) total += pinPrice;
    if (dailyDuplicate) total += dailyPrice;
    return total;
  }, [bundlePrice, pinPost, dailyDuplicate, pinPrice, dailyPrice]);

  const productLabel = products[productIndex]?.title ?? draftProduct.title ?? "";

  const applyProductCount = useCallback(
    (count: number) => {
      const bundle = bundles.find((b) => b.vacancyCount === count);
      setProductCount(count);
      setProductIndex(0);
      setProducts([]);
      setDraftProduct({ title: "" });
      setBundlePrice(bundle?.price ?? 0);
      setBundlePriceId(bundle?.id);
      setStep(HorecaSellStep.PRODUCT_TITLE);
    },
    [bundles],
  );

  const finishProductBlock = () => {
    if (productIndex + 1 < productCount) {
      setProductIndex((i) => i + 1);
      setDraftProduct({ title: "" });
      setStep(HorecaSellStep.PRODUCT_TITLE);
    } else {
      setStep(HorecaSellStep.CONTACT);
    }
  };

  const previewText = useMemo(() => {
    const footer = [
      t("bot.horecaSell.basePrice", { price: formatAmountUah(bundlePrice) }),
    ];
    if (pinPost) footer.push(t("bot.horecaSell.addonPin", { price: formatAddonUah(pinPrice) }));
    if (dailyDuplicate) footer.push(t("bot.horecaSell.addonDaily", { price: formatAddonUah(dailyPrice) }));
    footer.push(t("bot.horecaSell.totalPrice", { price: formatAmountUah(totalPrice) }));
    if (scheduledPostAt) footer.push(`📅 Публікація: ${scheduledPostAt}`);
    return formatHorecaProductPreview(
      { businessType, title, address, contactPhone, products },
      footer,
    );
  }, [address, bundlePrice, businessType, contactPhone, dailyDuplicate, dailyPrice, pinPost, pinPrice, products, scheduledPostAt, title, totalPrice]);

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
      setError(err instanceof Error ? err.message : i18n.bot.error);
    } finally {
      setPhotoUploading(false);
    }
  };

  const submit = async () => {
    if (!getToken() || !mediaUrl) return;
    setLoading(true);
    setError("");
    try {
      const res = await createHorecaSellListing({
        projectId,
        categoryId,
        cityId,
        businessType,
        title,
        address,
        pinPost,
        dailyDuplicate,
        scheduledPostAt,
        contactPhone,
        listingPrice: totalPrice,
        bundlePriceId,
        mediaUrls: [mediaUrl],
        positions: products.map(mapProductToApi),
      });
      setSubmittedId(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.bot.error);
    } finally {
      setLoading(false);
    }
  };

  if (!ready && !error) return <p className="text-sm text-slate-400">{i18n.common.loading}</p>;

  if (submittedId) {
    return (
      <div className="space-y-4">
        <p className="font-medium text-green-600">
          {i18n.bot.listing_submitted.replace("{{id}}", submittedId.slice(0, 8))}
        </p>
        <Link href="/account/listings" className={`${BTN_PRIMARY} w-full`}>Мої оголошення</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {step === HorecaSellStep.SELECT_CITY && (
        <>
          <p className="whitespace-pre-line text-sm text-slate-600">{i18n.bot.horecaSell.intro}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {cities.map((c) => (
              <button key={c.id} type="button" onClick={() => setCityId(c.id)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${cityId === c.id ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-slate-200"}`}>
                {c.name}
              </button>
            ))}
          </div>
          <button type="button" className={BTN_PRIMARY} disabled={!cityId} onClick={() => setStep(HorecaSellStep.BUSINESS_TYPE)}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.BUSINESS_TYPE && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.businessType}</p>
          <input className={INPUT_CLASS} value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
          <button type="button" className={BTN_PRIMARY} disabled={!businessType.trim()} onClick={() => setStep(HorecaSellStep.BUSINESS_NAME)}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.BUSINESS_NAME && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.businessName}</p>
          <input className={INPUT_CLASS} value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="button" className={BTN_PRIMARY} disabled={!title.trim()} onClick={() => setStep(HorecaSellStep.ADDRESS)}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.ADDRESS && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.address}</p>
          <input className={INPUT_CLASS} value={address} onChange={(e) => setAddress(e.target.value)} />
          <button type="button" className={BTN_PRIMARY} disabled={!address.trim()} onClick={() => setStep(HorecaSellStep.PRODUCT_COUNT)}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.PRODUCT_COUNT && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.productCount}</p>
          <div className="grid gap-3">
            {bundles.map((b) => (
              <button key={b.id} type="button" onClick={() => applyProductCount(b.vacancyCount)}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-brand">
                <span>{b.name.replace(/ваканс/i, "товар")}</span>
                <span className="font-semibold text-brand">{formatAmountUah(b.price)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === HorecaSellStep.PRODUCT_TITLE && (
        <>
          <p className="text-sm text-slate-600">{t("bot.horecaSell.productTitle", { n: productIndex + 1, total: productCount })}</p>
          <input className={INPUT_CLASS} value={draftProduct.title} onChange={(e) => setDraftProduct({ title: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" && draftProduct.title.trim()) {
              const next = [...products]; next[productIndex] = { title: draftProduct.title.trim() }; setProducts(next); setStep(HorecaSellStep.PRODUCT_PRICE);
            }}} />
          <button type="button" className={BTN_PRIMARY} disabled={!draftProduct.title.trim()} onClick={() => {
            const next = [...products]; next[productIndex] = { title: draftProduct.title.trim() }; setProducts(next); setStep(HorecaSellStep.PRODUCT_PRICE);
          }}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.PRODUCT_PRICE && (
        <>
          <p className="text-sm text-slate-600">{t("bot.horecaSell.productPrice", { title: productLabel })}</p>
          <input className={INPUT_CLASS} value={draftProduct.price ?? ""} onChange={(e) => setDraftProduct((p) => ({ ...p, price: e.target.value }))} />
          <button type="button" className={BTN_PRIMARY} disabled={!draftProduct.price?.trim()} onClick={() => {
            const next = [...products]; next[productIndex] = { ...next[productIndex], price: draftProduct.price }; setProducts(next); setStep(HorecaSellStep.PRODUCT_CONDITION);
          }}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.PRODUCT_CONDITION && (
        <>
          <p className="text-sm text-slate-600">{t("bot.horecaSell.productCondition", { title: productLabel })}</p>
          <input className={INPUT_CLASS} value={draftProduct.condition ?? ""} onChange={(e) => setDraftProduct((p) => ({ ...p, condition: e.target.value }))} />
          <button type="button" className={BTN_PRIMARY} disabled={!draftProduct.condition?.trim()} onClick={() => {
            const next = [...products]; next[productIndex] = { ...next[productIndex], condition: draftProduct.condition }; setProducts(next); setStep(HorecaSellStep.PRODUCT_DESCRIPTION);
          }}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.PRODUCT_DESCRIPTION && (
        <>
          <p className="text-sm text-slate-600">{t("bot.horecaSell.productDescription", { title: productLabel })}</p>
          <textarea className={INPUT_CLASS} rows={3} value={draftProduct.description ?? ""} onChange={(e) => setDraftProduct((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" className={BTN_SECONDARY} onClick={() => finishProductBlock()}>{i18n.bot.skip}</button>
            <button type="button" className={BTN_PRIMARY} onClick={() => {
              const next = [...products]; next[productIndex] = { ...next[productIndex], description: draftProduct.description }; setProducts(next); finishProductBlock();
            }}>{i18n.common.next}</button>
          </div>
        </>
      )}

      {step === HorecaSellStep.CONTACT && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.contact}</p>
          <input className={INPUT_CLASS} type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          <button type="button" className={BTN_PRIMARY} disabled={!contactPhone.trim()} onClick={() => setStep(HorecaSellStep.UPLOAD_PHOTOS)}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.UPLOAD_PHOTOS && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.uploadPhotos}</p>
          <input type="file" accept="image/*" disabled={photoUploading} onChange={(e) => void handlePhoto(e.target.files?.[0] ?? null)} />
          {photoPreview && <img src={photoPreview} alt="" className="max-h-48 rounded-xl border object-cover" />}
          <button type="button" className={BTN_PRIMARY} disabled={!mediaUrl || photoUploading} onClick={() => setStep(HorecaSellStep.PIN_POST)}>{i18n.common.next}</button>
        </>
      )}

      {step === HorecaSellStep.PIN_POST && (
        <>
          <p className="text-sm text-slate-600">{t("bot.horecaSell.pinPost", { price: formatAddonUah(pinPrice) })}</p>
          <div className="flex gap-2">
            <button type="button" className={BTN_PRIMARY} onClick={() => { setPinPost(true); setStep(HorecaSellStep.SCHEDULE_POST); }}>{i18n.common.yes}</button>
            <button type="button" className={BTN_SECONDARY} onClick={() => { setPinPost(false); setStep(HorecaSellStep.SCHEDULE_POST); }}>{i18n.common.no}</button>
          </div>
        </>
      )}

      {step === HorecaSellStep.SCHEDULE_POST && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.schedulePost}</p>
          <input className={INPUT_CLASS} value={scheduledPostAt ?? ""} onChange={(e) => setScheduledPostAt(e.target.value)} placeholder="09.06.26 12:00" />
          <div className="flex gap-2">
            <button type="button" className={BTN_SECONDARY} onClick={() => { setScheduledPostAt(undefined); setStep(HorecaSellStep.DAILY_DUPLICATE); }}>{i18n.bot.skip}</button>
            <button type="button" className={BTN_PRIMARY} onClick={() => setStep(HorecaSellStep.DAILY_DUPLICATE)}>{i18n.common.next}</button>
          </div>
        </>
      )}

      {step === HorecaSellStep.DAILY_DUPLICATE && (
        <>
          <p className="text-sm text-slate-600">{t("bot.horecaSell.dailyDuplicate", { price: formatAddonUah(dailyPrice) })}</p>
          <div className="flex gap-2">
            <button type="button" className={BTN_PRIMARY} onClick={() => { setDailyDuplicate(true); setStep(HorecaSellStep.PREVIEW); }}>{i18n.common.yes}</button>
            <button type="button" className={BTN_SECONDARY} onClick={() => { setDailyDuplicate(false); setStep(HorecaSellStep.PREVIEW); }}>{i18n.common.no}</button>
          </div>
        </>
      )}

      {step === HorecaSellStep.PREVIEW && (
        <>
          <p className="text-sm text-slate-600">{i18n.bot.horecaSell.preview}</p>
          {photoPreview && <img src={photoPreview} alt="" className="w-full max-h-56 rounded-xl object-cover border" />}
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm">{previewText}</pre>
          <button type="button" className={BTN_PRIMARY} disabled={loading} onClick={() => void submit()}>
            {loading ? i18n.common.loading : i18n.bot.confirmPay}
          </button>
        </>
      )}
    </div>
  );
}
