import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve } from "path";

// Prisma CLI doesn't load .env.local (Next.js convention) — load it manually
config({ path: resolve(process.cwd(), ".env.local") });

export default defineConfig({
  migrations: {
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct connection (the transaction pooler can't run DDL).
    // DATABASE_URL is the pooler used at runtime; fall back to it if DIRECT_URL is unset.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
