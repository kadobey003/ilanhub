import { createDb } from "./index.js";
import { eq } from "drizzle-orm";
import {
  categories,
  cities,
  districts,
  projects,
  regions,
  vacancyTypes,
} from "./schema/index.js";

const VACANCY_TIERS = [
  { slug: "vacancy-1", name: "1 вакансія", vacancyCount: 1, price: 299, sortOrder: 1 },
  { slug: "vacancy-2", name: "2 вакансії", vacancyCount: 2, price: 499, sortOrder: 2 },
  { slug: "vacancy-3", name: "3 вакансії", vacancyCount: 3, price: 699, sortOrder: 3 },
] as const;

export async function seed(connectionString: string) {
  const db = createDb(connectionString);

  const regionRows = await db
    .insert(regions)
    .values([
      { slug: "kyiv", name: "Київська область", sortOrder: 1 },
      { slug: "lviv", name: "Львівська область", sortOrder: 2 },
      { slug: "odesa", name: "Одеська область", sortOrder: 3 },
      { slug: "kharkiv", name: "Харківська область", sortOrder: 4 },
      { slug: "dnipro", name: "Дніпропетровська область", sortOrder: 5 },
      { slug: "zaporizhzhia", name: "Запорізька область", sortOrder: 6 },
    ])
    .onConflictDoNothing()
    .returning();

  const allRegions = regionRows.length
    ? regionRows
    : await db.select().from(regions);

  const kyivRegion = allRegions.find((r) => r.slug === "kyiv");
  if (kyivRegion) {
    const cityRows = await db
      .insert(cities)
      .values([
        { regionId: kyivRegion.id, slug: "kyiv", name: "Київ", sortOrder: 1 },
        { regionId: kyivRegion.id, slug: "bila-tserkva", name: "Біла Церква", sortOrder: 2 },
      ])
      .onConflictDoNothing()
      .returning();

    const allCities = cityRows.length
      ? cityRows
      : await db.select().from(cities).where(eq(cities.regionId, kyivRegion.id));

    const kyivCity = allCities.find((c) => c.slug === "kyiv");
    if (kyivCity) {
      await db
        .insert(districts)
        .values([
          { cityId: kyivCity.id, slug: "pecherskyi", name: "Печерський", sortOrder: 1 },
          { cityId: kyivCity.id, slug: "shevchenkivskyi", name: "Шевченківський", sortOrder: 2 },
          { cityId: kyivCity.id, slug: "podilskyi", name: "Подільський", sortOrder: 3 },
          { cityId: kyivCity.id, slug: "obolonskyi", name: "Оболонський", sortOrder: 4 },
          { cityId: kyivCity.id, slug: "solomianskyi", name: "Солом'янський", sortOrder: 5 },
        ])
        .onConflictDoNothing();
    }
  }

  const lvivRegion = allRegions.find((r) => r.slug === "lviv");
  if (lvivRegion) {
    await db
      .insert(cities)
      .values([{ regionId: lvivRegion.id, slug: "lviv", name: "Львів", sortOrder: 1 }])
      .onConflictDoNothing();
  }

  const odesaRegion = allRegions.find((r) => r.slug === "odesa");
  if (odesaRegion) {
    await db
      .insert(cities)
      .values([{ regionId: odesaRegion.id, slug: "odesa", name: "Одеса", sortOrder: 1 }])
      .onConflictDoNothing();
  }

  const kharkivRegion = allRegions.find((r) => r.slug === "kharkiv");
  if (kharkivRegion) {
    await db
      .insert(cities)
      .values([{ regionId: kharkivRegion.id, slug: "kharkiv", name: "Харків", sortOrder: 1 }])
      .onConflictDoNothing();
  }

  const dniproRegion = allRegions.find((r) => r.slug === "dnipro");
  if (dniproRegion) {
    await db
      .insert(cities)
      .values([{ regionId: dniproRegion.id, slug: "dnipro", name: "Дніпро", sortOrder: 1 }])
      .onConflictDoNothing();
  }

  const zaporizhzhiaRegion = allRegions.find((r) => r.slug === "zaporizhzhia");
  if (zaporizhzhiaRegion) {
    await db
      .insert(cities)
      .values([
        { regionId: zaporizhzhiaRegion.id, slug: "zaporizhzhia", name: "Запоріжжя", sortOrder: 1 },
      ])
      .onConflictDoNothing();
  }

  const projectRows = await db
    .insert(projects)
    .values([
      {
        slug: "horeca",
        name: "Horeca",
        description: "Ресторани, кафе, готелі",
      },
      {
        slug: "jobs",
        name: "Робота",
        description: "Вакансії по всій Україні",
      },
      {
        slug: "auto",
        name: "Авто",
        description: "Продаж автомобілів",
      },
    ])
    .onConflictDoNothing()
    .returning();

  const allProjects = projectRows.length
    ? projectRows
    : await db.select().from(projects);

  for (const project of allProjects) {
    const categoryValues =
      project.slug === "horeca"
        ? [
            { projectId: project.id, slug: "restaurant", name: "Ресторан", sortOrder: 1 },
            { projectId: project.id, slug: "cafe", name: "Кафе", sortOrder: 2 },
            { projectId: project.id, slug: "bar", name: "Бар", sortOrder: 3 },
            { projectId: project.id, slug: "hotel", name: "Готель", sortOrder: 4 },
            { projectId: project.id, slug: "hookah", name: "Наргілє", sortOrder: 5 },
            { projectId: project.id, slug: "used-equipment", name: "Б/в обладнання", sortOrder: 6 },
          ]
        : project.slug === "jobs"
          ? [
              { projectId: project.id, slug: "office", name: "Офіс", sortOrder: 1 },
              { projectId: project.id, slug: "it", name: "IT", sortOrder: 2 },
              { projectId: project.id, slug: "production", name: "Виробництво", sortOrder: 3 },
              { projectId: project.id, slug: "logistics", name: "Логістика", sortOrder: 4 },
              { projectId: project.id, slug: "sales", name: "Продажі", sortOrder: 5 },
              { projectId: project.id, slug: "construction", name: "Будівництво", sortOrder: 6 },
              { projectId: project.id, slug: "other", name: "Інше", sortOrder: 7 },
            ]
          : [
              { projectId: project.id, slug: "general", name: "Загальне", sortOrder: 1 },
              { projectId: project.id, slug: "premium", name: "Преміум", sortOrder: 2 },
            ];

    await db.insert(categories).values(categoryValues).onConflictDoNothing();

    await db
      .insert(vacancyTypes)
      .values(
        VACANCY_TIERS.map((t) => ({
          projectId: project.id,
          slug: t.slug,
          name: t.name,
          vacancyCount: t.vacancyCount,
          price: t.price,
          sortOrder: t.sortOrder,
        })),
      )
      .onConflictDoNothing();
  }

  console.log("Seed tamamlandı:", {
    regions: allRegions.length,
    projects: allProjects.length,
  });
}

const url =
  process.env.DATABASE_URL ??
  "postgresql://ilanhub:secret@localhost:5432/ilanhub";

seed(url)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
