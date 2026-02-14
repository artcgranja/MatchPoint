/**
 * One-time seed: migrate existing Connection.emailBody → ConnectionMessage
 *
 * Usage: pnpm db:seed:messages
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const connections = await prisma.connection.findMany({
    select: {
      id: true,
      seekerId: true,
      emailBody: true,
      createdAt: true,
      _count: { select: { messages: true } },
    },
  });

  let created = 0;
  let skipped = 0;

  for (const conn of connections) {
    if (conn._count.messages > 0) {
      skipped++;
      continue;
    }

    await prisma.connectionMessage.create({
      data: {
        connectionId: conn.id,
        senderId: conn.seekerId,
        content: conn.emailBody,
        isSystem: true,
        createdAt: conn.createdAt,
      },
    });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already had messages): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
