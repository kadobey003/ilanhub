import {
  AUTO_CONDITION_LABELS,
  AUTO_DRIVE_LABELS,
  AUTO_FUEL_LABELS,
  AUTO_TRANSMISSION_LABELS,
  type BotVehicle,
} from "@ilanhub/shared";

interface Props {
  vehicle: BotVehicle;
}

export function AutoSpecsGrid({ vehicle }: Props) {
  const items = [
    { label: "Рік", value: String(vehicle.year) },
    { label: "Пробіг", value: `${vehicle.mileage.toLocaleString("uk-UA")} км` },
    { label: "Паливо", value: AUTO_FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType },
    {
      label: "Коробка",
      value: AUTO_TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission,
    },
    vehicle.engineVolume ? { label: "Обʼєм", value: `${vehicle.engineVolume} л` } : null,
    vehicle.driveType
      ? { label: "Привід", value: AUTO_DRIVE_LABELS[vehicle.driveType] ?? vehicle.driveType }
      : null,
    vehicle.color ? { label: "Колір", value: vehicle.color } : null,
    {
      label: "Стан",
      value: AUTO_CONDITION_LABELS[vehicle.condition] ?? vehicle.condition,
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5"
        >
          <p className="text-xs text-emerald-700">{item.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
