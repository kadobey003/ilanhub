export interface HorecaRole {
  slug: string;
  name: string;
  keywords: string[];
  description: string;
}

export const HORECA_ROLES: HorecaRole[] = [
  {
    slug: "kuhar",
    name: "Кухар",
    keywords: ["кухар", "кухаря", "кухарів"],
    description: "Вакансії кухаря в ресторанах, кафе та готелях по всій Україні.",
  },
  {
    slug: "oficiant",
    name: "Офіціант",
    keywords: ["офіціант", "офіціанта", "офіціантів"],
    description: "Робота офіціантом у закладах HoReCa — Київ, Львів, Одеса та інші міста.",
  },
  {
    slug: "barmen",
    name: "Бармен",
    keywords: ["бармен", "бармена", "барменів"],
    description: "Вакансії бармена в барах, ресторанах та готелях України.",
  },
  {
    slug: "administrator",
    name: "Адміністратор",
    keywords: ["адміністратор", "адміністратора"],
    description: "Адміністратор закладу — вакансії в ресторанах та готелях.",
  },
  {
    slug: "povar",
    name: "Повар",
    keywords: ["повар", "кухар"],
    description: "Робота поваром у закладах гостинності по Україні.",
  },
  {
    slug: "hostes",
    name: "Хостес",
    keywords: ["хостес"],
    description: "Вакансії хостес у ресторанах та готелях.",
  },
  {
    slug: "menedzher-zalu",
    name: "Менеджер залу",
    keywords: ["менеджер залу", "менеджер"],
    description: "Менеджер залу — керування обслуговуванням у закладах HoReCa.",
  },
];

export function getHorecaRole(slug: string): HorecaRole | undefined {
  return HORECA_ROLES.find((r) => r.slug === slug);
}

export const JOB_CATEGORIES = [
  { slug: "it", name: "IT", keywords: ["it", "айті", "програміст", "розробник"] },
  { slug: "ofis", name: "Офіс", keywords: ["офіс", "офісна", "менеджер", "секретар"] },
  { slug: "sklad", name: "Склад", keywords: ["склад", "комірник", "вантажник"] },
  { slug: "vyrobnytstvo", name: "Виробництво", keywords: ["виробництво", "завод", "оператор"] },
  { slug: "budivnytstvo", name: "Будівництво", keywords: ["будівництво", "будівельник", "монтажник"] },
  { slug: "logistyka", name: "Логістика", keywords: ["логістика", "водій", "кур'єр", "доставка"] },
];

export function getJobCategory(slug: string) {
  return JOB_CATEGORIES.find((c) => c.slug === slug);
}

export const FAQ_ITEMS = [
  {
    question: "Чи безкоштовно подати вакансію?",
    answer:
      "Так, є безкоштовний тариф — 1 оголошення на місяць. Додаткові вакансії та VIP-підсилення доступні за окремими тарифами.",
  },
  {
    question: "Як швидко знаходять кандидатів?",
    answer:
      "Після модерації (до 24 годин) оголошення автоматично публікується у Telegram, Viber, WhatsApp та на сайті. Кандидати бачать вакансію одразу у своїх месенджерах.",
  },
  {
    question: "Чим Horeca відрізняється від загальної «Роботи»?",
    answer:
      "Horeca — окремий напрям лише для ресторанів, кафе, барів та готелів. Загальна «Робота» охоплює IT, офіс, склад, виробництво та інші сектори.",
  },
  {
    question: "Чи можна подати оголошення через Telegram?",
    answer:
      "Так. Напишіть нашому боту в Telegram — подайте вакансію за 7 кроків без реєстрації на сайті. Публікація синхронізується з усіма каналами.",
  },
  {
    question: "У яких містах доступні вакансії?",
    answer:
      "По всій Україні: Київ, Львів, Одеса, Харків, Дніпро, Запоріжжя та інші міста. Оберіть своє місто у фільтрі.",
  },
];
