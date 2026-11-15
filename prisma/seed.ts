import dns from "node:dns";
import net from "node:net";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { slugify } from "../src/config/utils";

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

interface SeedProductItem {
  id: number;
  name: string;
  color: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  category: string;
  sizes: string[];
  images: string[];
  temporaryImages?: string[];
  isNew: boolean;
  isSoldOut?: boolean;
  comboId?: string;
  comboTitle?: string;
  description?: string;
}

const SEED_PRODUCTS: SeedProductItem[] = [
  {
    id: 1,
    name: "Zip Out Work Jacket",
    color: "Terracotta",
    price: 260,
    costPrice: 140,
    category: "Outerwear",
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      "/images/products/p1-01.jpg",
      "/images/products/p2-01.webp",
      "/images/products/p3-01.jpg",
      "/images/products/p4-01.webp",
    ],
    temporaryImages: [
      "/images/home/home-outerwear.webp",
      "/images/collection/coll-04-jacket.webp",
    ],
    isNew: true,
    comboId: "look-01",
    comboTitle: "Look 01 · Archive Workwear Set",
  },
  {
    id: 2,
    name: "Distressed Archive Denim",
    color: "Faded Indigo",
    price: 290,
    costPrice: 160,
    category: "Bottoms",
    sizes: ["28", "30", "32", "34", "36"],
    images: [
      "/images/products/p1-02.webp",
      "/images/products/p4-02.webp",
      "/images/products/p5-02.jpg",
      "/images/products/p2-02.jpg",
      "/images/products/p3-02.jpg",
    ],
    temporaryImages: ["/images/collection/coll-02-denim.webp"],
    isNew: true,
    comboId: "look-01",
    comboTitle: "Look 01 · Archive Workwear Set",
  },
  {
    id: 3,
    name: "Baggy Japanese Denim",
    color: "Dakota Blue",
    price: 230,
    costPrice: 120,
    category: "Bottoms",
    sizes: ["28", "30", "32", "34", "36"],
    images: [
      "/images/products/p1-03.webp",
      "/images/collection/coll-02-denim.webp",
      "/images/products/p1-08.jpg",
      "/images/products/p1-12.webp",
    ],
    isNew: true,
    comboId: "look-02",
    comboTitle: "Look 02 · Tailored Street Set",
  },
  {
    id: 4,
    name: "Division Cargo Pants",
    color: "Espresso Brown",
    price: 220,
    category: "Bottoms",
    sizes: ["28", "30", "32", "34", "36"],
    images: [
      "/images/products/p1-04.webp",
      "/images/products/p2-01.webp",
      "/images/products/p1-11.webp",
      "/images/products/p4-01.webp",
    ],
    isNew: true,
  },
  {
    id: 5,
    name: "Johnny Knit Polo",
    color: "Oxblood Melange",
    price: 175,
    category: "Tees",
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/products/p1-05.webp",
      "/images/collection/coll-01-sweeter.jpg",
      "/images/products/p1-13.webp",
      "/images/products/p1-14.webp",
    ],
    isNew: true,
  },
  {
    id: 6,
    name: "Leather Trucker Jacket",
    color: "Obsidian Black",
    price: 480,
    costPrice: 280,
    category: "Outerwear",
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/products/p1-06.jpg",
      "/images/collection/coll-04-jacket.webp",
      "/images/products/p2-02.jpg",
      "/images/products/p3-02.jpg",
    ],
    temporaryImages: ["/images/collection/coll-04-jacket.webp"],
    isNew: true,
    comboId: "look-02",
    comboTitle: "Look 02 · Tailored Street Set",
  },
  {
    id: 7,
    name: "Spiral Zip Boot",
    color: "Distressed Black",
    price: 550,
    costPrice: 320,
    category: "Items",
    sizes: ["40", "41", "42", "43", "44"],
    images: [
      "/images/products/p1-07.webp",
      "/images/products/p3-01.jpg",
      "/images/products/p4-01.webp",
      "/images/products/p1-06.jpg",
    ],
    isNew: true,
    comboId: "look-02",
    comboTitle: "Look 02 · Tailored Street Set",
  },
  {
    id: 8,
    name: "Torai Wide Leg Denim",
    color: "Hickory Stripe",
    price: 260,
    category: "Bottoms",
    sizes: ["28", "30", "32", "34"],
    images: [
      "/images/products/p1-08.jpg",
      "/images/collection/coll-02-denim.webp",
      "/images/products/p1-03.webp",
      "/images/products/p1-12.webp",
    ],
    isNew: true,
  },
  {
    id: 9,
    name: "Silk Bias Slip Dress",
    color: "Raw Ivory",
    price: 165,
    originalPrice: 295,
    category: "Items",
    sizes: ["XS", "S", "M", "L"],
    images: [
      "/images/products/p1-09.webp",
      "/images/products/p1-10.webp",
      "/images/products/p1-15.webp",
      "/images/home/home-04.jpg",
    ],
    isNew: false,
  },
  {
    id: 10,
    name: "Structured Wool Blazer",
    color: "Charcoal",
    price: 295,
    originalPrice: 545,
    category: "Outerwear",
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/products/p1-10.webp",
      "/images/collection/coll-04-jacket.webp",
      "/images/products/p1-02.webp",
      "/images/products/p4-02.webp",
    ],
    isNew: false,
  },
  {
    id: 11,
    name: "Ceramic Drop Necklace",
    color: "Chalk White",
    price: 85,
    originalPrice: 145,
    category: "Items",
    sizes: ["OS"],
    images: [
      "/images/products/p1-11.webp",
      "/images/products/p1-15.webp",
      "/images/products/p4-01.webp",
      "/images/home/home-05.jpg",
    ],
    isNew: false,
    isSoldOut: true,
    comboId: "look-01",
    comboTitle: "Look 01 · Archive Workwear Set",
  },
  {
    id: 12,
    name: "Washed Black Baggy Jeans",
    color: "Washed Black",
    price: 160,
    originalPrice: 230,
    category: "Bottoms",
    sizes: ["28", "30", "32", "34"],
    images: [
      "/images/products/p1-12.webp",
      "/images/collection/coll-02-denim.webp",
      "/images/products/p1-03.webp",
      "/images/products/p1-08.jpg",
    ],
    isNew: false,
  },
  {
    id: 13,
    name: "Brushed Mohair Cardigan",
    color: "Oatmeal Melange",
    price: 310,
    costPrice: 170,
    category: "Sweatshirt",
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      "/images/products/p1-13.webp",
      "/images/collection/coll-01-sweeter.jpg",
      "/images/products/p1-05.webp",
      "/images/products/p1-14.webp",
    ],
    isNew: true,
  },
  {
    id: 14,
    name: "Oversized Poplin Shirt",
    color: "Crisp Optic",
    price: 195,
    costPrice: 100,
    category: "Tees",
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      "/images/products/p1-14.webp",
      "/images/collection/coll-03-shirts.webp",
      "/images/products/p1-15.webp",
      "/images/products/p2-01.webp",
    ],
    isNew: true,
  },
  {
    id: 15,
    name: "Pleated Wide Trousers",
    color: "Ash Taupe",
    price: 245,
    category: "Bottoms",
    sizes: ["28", "30", "32", "34", "36"],
    images: [
      "/images/products/p1-15.webp",
      "/images/products/p1-04.webp",
      "/images/products/p2-01.webp",
      "/images/products/p4-01.webp",
    ],
    isNew: true,
  },
  {
    id: 16,
    name: "TAGE Utility Zip Trousers",
    color: "Washed Obsidian",
    price: 380,
    originalPrice: 480,
    category: "Bottoms",
    sizes: ["28", "30", "32", "34", "36"],
    images: [
      "/images/products/p3-16.webp",
      "/images/products/p1-16.webp",
      "/images/products/p2-16.webp",
      "/images/products/p4-16.webp",
    ],
    isNew: false,
  },
];

async function main() {
  console.log("🌱 Starting database seeding...");

  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@tage.studio";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "password123456";

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

    console.log(`ℹ️ Admin user already exists; refreshed credentials for: ${adminEmail}`);
  }

  // 2. Seed Categories & Initial Products
  for (const prod of SEED_PRODUCTS) {
    const catSlug = slugify(prod.category);
    const category = await prisma.category.upsert({
      where: { slug: catSlug },
      update: { name: prod.category },
      create: {
        name: prod.category,
        slug: catSlug,
        sortOrder: 1,
        isActive: true,
      },
    });

    const slug = `${slugify(prod.name)}-${prod.id}`;
    const sizeLabel = prod.sizes?.[0] || "M";
    const sku = `TG-FW26-${String(prod.id).padStart(2, "0")}-${sizeLabel}`;
    const isSoldOut = Boolean(prod.isSoldOut);

    const existingItem = await prisma.item.findUnique({
      where: { slug },
    });

    if (!existingItem) {
      await prisma.item.create({
        data: {
          sku,
          slug,
          title: prod.name,
          description:
            prod.description ||
            "Relaxed, considered fit with clean architectural finishing. Crafted for longevity across seasons. Model is 183 cm and wears size M.",
          categoryId: category.id,
          sizeLabel: prod.sizes.join(", "),
          color: prod.color || "Standard",
          priceMinor: Math.round(prod.price * 100),
          originalPriceMinor: prod.originalPrice
            ? Math.round(prod.originalPrice * 100)
            : null,
          costMinor: prod.costPrice ? Math.round(prod.costPrice * 100) : null,
          status: isSoldOut ? "SOLD" : "AVAILABLE",
          isNew: prod.isNew ?? true,
          comboId: prod.comboId || null,
          comboTitle: prod.comboTitle || null,
          createdById: adminUser.id,
          images: {
            create: [
              ...(prod.images || ["/images/products/p1-01.jpg"]).map(
                (url, idx) => ({
                  url,
                  storageKey: `seed-${sku}-${idx}`,
                  sortOrder: idx,
                  isTemporary: false,
                })
              ),
              ...(prod.temporaryImages || []).map((url, idx) => ({
                url,
                storageKey: `seed-temp-${sku}-${idx}`,
                sortOrder: 100 + idx,
                isTemporary: true,
              })),
            ],
          },
        },
      });
    }
  }

  console.log(`✅ Seeded categories and ${SEED_PRODUCTS.length} initial products`);
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
