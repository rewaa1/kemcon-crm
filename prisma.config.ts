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
    url: process.env.DATABASE_URL,
  },
});
