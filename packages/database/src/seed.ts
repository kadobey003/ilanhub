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
