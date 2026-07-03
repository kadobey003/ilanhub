import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Сторінку не знайдено</h1>
      <p className="mt-2 text-slate-500">Можливо, посилання застаріло.</p>
      <div className="mt-8">
        <Button href="/">На головну</Button>
      </div>
    </div>
  );
}
