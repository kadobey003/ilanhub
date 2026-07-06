"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { t } from "@ilanhub/i18n";
import { parsePhoneInput } from "@ilanhub/shared";
import { BrandLogo } from "@/components/BrandLogo";
import { authApi } from "@/lib/auth-api";
import { redirectAfterAuth, saveSession } from "@/lib/auth";

type RegisterStep = "form" | "foreign_confirm" | "telegram";
type LoginStep = "phone" | "otp";

function resolvePhoneInput(raw: string, auth: (key: string) => string) {
  const parsed = parsePhoneInput(raw);
  if (!parsed) return { error: auth("phone_invalid") as string };
  return { parsed };
}

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const isLogin = mode === "login";
  const auth = (key: string) => t(`web.auth.${key}`);

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [linkToken, setLinkToken] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");

  const [loginStep, setLoginStep] = useState<LoginStep>("phone");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [telegramHint, setTelegramHint] = useState<string | undefined>();
  const [foreignPhone, setForeignPhone] = useState<string | null>(null);

  const normalizePhoneField = () => {
    const result = resolvePhoneInput(phone, auth);
    if (result.parsed) setPhone(result.parsed.phone);
  };

  const pollLinkStatus = useCallback(async () => {
    if (!linkToken) return;
    try {
      const res = await authApi.linkStatus(linkToken);
      if (res.status === "verified" && res.accessToken) {
        saveSession(res.accessToken, res.user ?? undefined);
        redirectAfterAuth(from);
      }
      if (res.status === "expired") {
        setError("Посилання застаріло");
        setRegisterStep("form");
      }
    } catch {
      /* retry */
    }
  }, [linkToken, from]);

  useEffect(() => {
    if (registerStep !== "telegram" || !linkToken) return;
    const id = setInterval(pollLinkStatus, 3000);
    return () => clearInterval(id);
  }, [registerStep, linkToken, pollLinkStatus]);

  async function submitRegister(normalizedPhone: string) {
    setLoading(true);
    try {
      const res = await authApi.register(normalizedPhone, name);
      setPhone(normalizedPhone);
      setLinkToken(res.linkToken);
      setTelegramUrl(res.telegramUrl);
      setForeignPhone(null);
      setRegisterStep("telegram");
    } catch (err) {
      setError(err instanceof Error ? err.message : auth("phone_required"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = resolvePhoneInput(phone, auth);
    if (!result.parsed) {
      setError(result.error ?? auth("phone_invalid"));
      return;
    }

    if (!result.parsed.isUkraine) {
      setPhone(result.parsed.phone);
      setForeignPhone(result.parsed.phone);
      setRegisterStep("foreign_confirm");
      return;
    }

    setPhone(result.parsed.phone);
    await submitRegister(result.parsed.phone);
  }

  async function handleForeignConfirm() {
    if (!foreignPhone) return;
    setError("");
    await submitRegister(foreignPhone);
  }

  async function handleLoginRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = resolvePhoneInput(phone, auth);
    if (!result.parsed) {
      setError(result.error ?? auth("phone_invalid"));
      return;
    }

    setPhone(result.parsed.phone);
    setLoading(true);
    try {
      const res = await authApi.loginRequest(result.parsed.phone);
      setDevCode(res.devCode);
      setTelegramHint(res.telegramHint);
      setLoginStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  }

  const isDev = process.env.NODE_ENV === "development";

  async function handleDevLogin() {
    setError("");
    setLoading(true);
    try {
      const res = await authApi.devLogin();
      saveSession(res.accessToken, res.user);
      redirectAfterAuth(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.loginVerify(phone, code);
      saveSession(res.accessToken, res.user);
      redirectAfterAuth(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невірний код");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
  const btnClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-50";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center">
          <BrandLogo className="mx-auto" height={56} />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {isLogin ? auth("login_title") : auth("register_title")}
          </h1>
          {isLogin && loginStep === "phone" && (
            <p className="mt-2 text-sm text-slate-500">{auth("login_hint")}</p>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {isLogin ? (
          loginStep === "phone" ? (
            <form className="mt-8 space-y-4" onSubmit={handleLoginRequest}>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {auth("phone_label")}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={normalizePhoneField}
                  className={inputClass}
                  placeholder={auth("phone_placeholder")}
                />
              </div>
              <button type="submit" className={btnClass} disabled={loading}>
                {loading ? "…" : auth("login_submit")}
              </button>
              {isDev && (
                <button
                  type="button"
                  className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                  onClick={handleDevLogin}
                  disabled={loading}
                >
                  ⚡ Швидкий вхід (dev)
                </button>
              )}
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={handleLoginVerify}>
              <p className="text-sm text-slate-500">
                Код надіслано в Telegram
                {devCode && (
                  <span className="mt-1 block font-mono text-brand">
                    Dev: {devCode}
                  </span>
                )}
                {telegramHint && (
                  <span className="mt-2 block text-amber-700">{telegramHint}</span>
                )}
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {auth("otp_label")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={inputClass}
                  placeholder={auth("otp_placeholder")}
                />
              </div>
              <button type="submit" className={btnClass} disabled={loading}>
                {loading ? "…" : auth("verify_submit")}
              </button>
              <button
                type="button"
                className="w-full text-sm text-slate-500 hover:text-brand"
                onClick={() => setLoginStep("phone")}
              >
                ← Інший номер
              </button>
            </form>
          )
        ) : registerStep === "foreign_confirm" ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {auth("foreign_phone_title")}
            </h2>
            <p className="text-sm text-slate-600">
              {t("web.auth.foreign_phone_desc", { phone: foreignPhone ?? phone })}
            </p>
            <button
              type="button"
              className={btnClass}
              disabled={loading}
              onClick={handleForeignConfirm}
            >
              {loading ? "…" : auth("foreign_phone_confirm")}
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                setForeignPhone(null);
                setRegisterStep("form");
              }}
            >
              {auth("foreign_phone_change")}
            </button>
          </div>
        ) : registerStep === "form" ? (
          <form className="mt-8 space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                {auth("name_label")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder={auth("name_placeholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                {auth("phone_label")} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={normalizePhoneField}
                className={inputClass}
                placeholder={auth("phone_placeholder")}
              />
            </div>
            <button type="submit" className={btnClass} disabled={loading}>
              {loading ? "…" : auth("register_submit")}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              {auth("telegram_step_title")}
            </h2>
            <p className="text-sm text-slate-500">{auth("telegram_step_desc")}</p>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={btnClass}
            >
              {auth("open_telegram")}
            </a>
            <p className="text-sm text-slate-400 animate-pulse">
              {auth("waiting_telegram")}
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? (
            <>
              Немає акаунту?{" "}
              <Link
                href={`/register${from ? `?from=${from}` : ""}`}
                className="font-semibold text-brand hover:underline"
              >
                Реєстрація
              </Link>
            </>
          ) : (
            <>
              Вже є акаунт?{" "}
              <Link
                href={`/login${from ? `?from=${from}` : ""}`}
                className="font-semibold text-brand hover:underline"
              >
                Увійти
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-blue-50/30">
      <Suspense fallback={<div className="text-slate-400">Завантаження…</div>}>
        <AuthForm mode={mode} />
      </Suspense>
    </div>
  );
}

export function LoginPage() {
  return <AuthPage mode="login" />;
}

export function RegisterPage() {
  return <AuthPage mode="register" />;
}
