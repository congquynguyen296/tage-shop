import dotenv from "dotenv";
import dns from "node:dns";
import net from "node:net";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

// Load .env.local first (for local Docker PostgreSQL) and fall back to .env
dotenv.config({ path: [".env.local", ".env"] });

dns.setDefaultResultOrder("ipv4first");
if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === "function") {
  net.setDefaultAutoSelectFamilyAttemptTimeout(5000);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace(
    /sslmode=(require|prefer|verify-ca)\b/g,
    "sslmode=verify-full"
  ),
  connectionTimeoutMillis: 20000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CORE_CATEGORIES = [
  { name: "Outerwear", slug: "outerwear", sortOrder: 1 },
  { name: "Tees", slug: "tees", sortOrder: 2 },
  { name: "Bottoms", slug: "bottoms", sortOrder: 3 },
  { name: "Sweatshirt", slug: "sweatshirt", sortOrder: 4 },
  { name: "Items", slug: "items", sortOrder: 5 },
  { name: "Collection", slug: "collection", sortOrder: 6 },
];

async function main() {
  console.log("🌱 Starting database seeding...");

  const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD in environment variables (.env.local / .env)"
    );
  }

  // 1. Seed or update Admin User
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const hashedPassword = await hashPassword(adminPassword);

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin TAGE",
        role: "admin",
        emailVerified: true,
        banned: false,
        twoFactorEnabled: false,
      },
    });

    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    console.log(`✅ Created Admin user: ${adminEmail}`);
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        role: "admin",
        emailVerified: true,
      },
    });

    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: adminUser.id,
        providerId: "credential",
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: adminUser.id,
          accountId: adminUser.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    } else {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword },
      });
    }

    console.log(
      `ℹ️ Admin user already exists; refreshed credentials for: ${adminEmail}`
    );
  }

  // 2. Seed Core Categories
  for (const cat of CORE_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(
    `✅ Seeded ${CORE_CATEGORIES.length} core categories (${CORE_CATEGORIES.map((c) => c.name).join(", ")})`
  );
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
