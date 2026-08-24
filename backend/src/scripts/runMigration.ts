import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../db.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

async function runMigration(): Promise<void> {
  const migrationPath = path.resolve(
    currentDirectory,
    "../../migrations/004_add_inventory_barcode.sql",
  );

  const migrationSql = await readFile(
    migrationPath,
    "utf8",
  );

  try {
    await pool.query(migrationSql);
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Inventory barcode migration failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void runMigration();