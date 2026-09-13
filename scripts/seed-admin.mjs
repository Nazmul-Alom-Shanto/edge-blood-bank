#!/usr/bin/env node
/**
 * B24 Blood Bank — Admin Seed Script
 *
 * Creates the initial admin account in your D1 database.
 * Run ONCE after creating your D1 database:
 *
 *   node scripts/seed-admin.mjs
 *
 * Make sure you have wrangler configured with your D1 database ID in wrangler.toml first.
 */

import { randomUUID } from "crypto";
import { createHash } from "crypto";

// Simple bcrypt-compatible hash using wrangler's exec
// We'll use wrangler to run the SQL directly

const ADMIN_NAME = "[Admin Name]";
const ADMIN_EMAIL = "[EMAIL_ADDRESS]";
const ADMIN_PASSWORD = "[PASSWORD]"; // CHANGE THIS BEFORE USE!

// Generate a bcrypt-like hash via node (requires bcryptjs installed)
async function main() {
  const { default: bcrypt } = await import("bcryptjs");

  const id = randomUUID();
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = Math.floor(Date.now() / 1000);

  const sql = `INSERT OR IGNORE INTO b24_bb_users (id, name, email, password, role, created_at, updated_at)
VALUES ('${id}', '${ADMIN_NAME}', '${ADMIN_EMAIL}', '${hashed}', 'admin', ${now}, ${now});`;

  console.log("\n🩸 B24 Blood Bank — Admin Seed\n");
  console.log("Run this SQL against your D1 database using wrangler:\n");
  console.log("  npx wrangler d1 execute bijoy-hobby-db --remote --command=\"<SQL>\"\n");
  console.log("Or pipe it:\n");
  console.log(`  npx wrangler d1 execute bijoy-hobby-db --remote --command="${sql.replace(/\n/g, " ")}"`);
  console.log("\nOr run the migration first:\n");
  console.log("  npx wrangler d1 migrations apply bijoy-hobby-db --remote\n");
  console.log("Generated SQL:\n");
  console.log(sql);
  console.log("\nLogin credentials:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("\n⚠️  CHANGE THE PASSWORD after first login!\n");
}

main().catch(console.error);
