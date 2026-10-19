import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is not set. Add the direct Neon connection string to .env.local.",
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  dialect: "postgresql",
  // No `out` / migrations folder: this project uses `drizzle-kit push` only.
  dbCredentials: {
    // Schema changes must run on the direct (non-pooled) connection.
    url: process.env.DATABASE_URL_UNPOOLED,
  },
});