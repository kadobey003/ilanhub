export interface VacancyDisplay {
  title: string;
  experience?: string | null;
  salary?: string | null;
  schedule?: string | null;
  workTime?: string | null;
  description?: string | null;
  workingHours?: string | null;
}

export function formatVacancyPlain(v: VacancyDisplay, index: number): string {
  const lines = [`${index + 1}. ${v.title}`];
  if (v.experience) lines.push(`   📈 ${v.experience}`);
  if (v.salary) lines.push(`   💵 ${v.salary}`);
  if (v.schedule) lines.push(`   📆 ${v.schedule}`);
  if (v.workTime) lines.push(`   ⏰ ${v.workTime}`);
  if (!v.schedule && !v.workTime && v.workingHours) {
    lines.push(`   🕐 ${v.workingHours}`);
  }
  if (v.description?.trim()) lines.push(`   📝 ${v.description.trim()}`);
  return lines.join("\n");
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatVacancyHtml(v: VacancyDisplay, index: number): string {
  const lines = [`<b>${index + 1}. ${esc(v.title)}</b>`];
  if (v.experience) lines.push(`📈 ${esc(v.experience)}`);
  if (v.salary) lines.push(`💵 ${esc(v.salary)}`);
  if (v.schedule) lines.push(`📆 ${esc(v.schedule)}`);
  if (v.workTime) lines.push(`⏰ ${esc(v.workTime)}`);
  if (!v.schedule && !v.workTime && v.workingHours) {
    lines.push(`🕐 ${esc(v.workingHours)}`);
  }
  if (v.description?.trim()) lines.push(`📝 ${esc(v.description.trim())}`);
  return lines.join("\n");
}

/** Map DB/API row to display fields */
export function vacancyFromLegacy(row: {
  title: string;
  salary?: string | null;
  workingHours?: string | null;
  description?: string | null;
}): VacancyDisplay {
  return {
    title: row.title,
    salary: row.salary,
    workingHours: row.workingHours,
    description: row.description,
  };
}
