import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-5xl">📋</p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Оголошення не знайдено</h1>
      <p className="mt-2 text-slate-600">Можливо, воно вже зняте або ще не опубліковане.</p>
      <Link
        href="/horeca"
        className="mt-6 inline-block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
      >
        До Horeca
      </Link>
    </div>
  );
}
