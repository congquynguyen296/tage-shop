import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

// Load .env.local first (for local Docker PostgreSQL) and fall back to .env
dotenv.config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

