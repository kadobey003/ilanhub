import { FAQ_ITEMS } from "@/lib/seo-content";

export function FaqSection() {
  return (
    <section className="px-4 py-8 md:px-0 md:py-12" id="faq">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Часті питання
        </h2>
        <dl className="mt-8 space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <dt className="font-semibold text-slate-900">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
