import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const YC_API_URL = "https://yc-oss.github.io/api/companies/all.json";
const BATCH_SIZE = 100;

interface YCCompany {
  id: number;
  name: string;
  slug: string;
  former_names: string[];
  small_logo_thumb_url: string;
  website: string;
  all_locations: string;
  long_description: string;
  one_liner: string;
  team_size: number;
  industry: string;
  subindustry: string;
  launched_at: number | null;
  tags: string[];
  tags_highlighted: string[];
  top_company: boolean;
  isHiring: boolean;
  nonprofit: boolean;
  batch: string;
  status: string;
  industries: string[];
  regions: string[];
  stage: string;
  app_video_public: boolean;
  demo_day_video_public: boolean;
  app_answers: unknown;
  question_answers: boolean;
  url: string;
  api: string;
}

async function syncYC() {
  console.log("Fetching YC company data...");
  const response = await fetch(YC_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch YC API: ${response.status} ${response.statusText}`);
  }

  const companies: YCCompany[] = await response.json();
  console.log(`Fetched ${companies.length} companies from YC API`);

  // Filter out companies with missing essential data
  const valid = companies.filter(
    (c) => c.id && c.name && c.slug
  );
  console.log(`${valid.length} companies have valid data`);

  // Process in batches
  let processed = 0;
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((c) =>
        prisma.company.upsert({
          where: { id: c.id },
          update: {
            name: c.name,
            slug: c.slug,
            oneLiner: c.one_liner ?? "",
            longDescription: c.long_description ?? "",
            website: c.website ?? "",
            smallLogoUrl: c.small_logo_thumb_url ?? "",
            allLocations: c.all_locations ?? "",
            teamSize: c.team_size ?? 0,
            industry: c.industry ?? "",
            subindustry: c.subindustry ?? "",
            industries: c.industries ?? [],
            tags: c.tags ?? [],
            batch: c.batch ?? "",
            status: c.status ?? "",
            stage: c.stage ?? "",
            regions: c.regions ?? [],
            topCompany: c.top_company ?? false,
            isHiring: c.isHiring ?? false,
            nonprofit: c.nonprofit ?? false,
            launchedAt: c.launched_at,
            ycUrl: c.url ?? "",
            syncedAt: new Date(),
          },
          create: {
            id: c.id,
            name: c.name,
            slug: c.slug,
            oneLiner: c.one_liner ?? "",
            longDescription: c.long_description ?? "",
            website: c.website ?? "",
            smallLogoUrl: c.small_logo_thumb_url ?? "",
            allLocations: c.all_locations ?? "",
            teamSize: c.team_size ?? 0,
            industry: c.industry ?? "",
            subindustry: c.subindustry ?? "",
            industries: c.industries ?? [],
            tags: c.tags ?? [],
            batch: c.batch ?? "",
            status: c.status ?? "",
            stage: c.stage ?? "",
            regions: c.regions ?? [],
            topCompany: c.top_company ?? false,
            isHiring: c.isHiring ?? false,
            nonprofit: c.nonprofit ?? false,
            launchedAt: c.launched_at,
            ycUrl: c.url ?? "",
          },
        })
      )
    );

    processed += batch.length;
    console.log(`  Synced ${processed}/${valid.length} companies`);
  }

  const count = await prisma.company.count();
  console.log(`\nSync complete! ${count} companies in database.`);
}

syncYC()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Sync failed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
