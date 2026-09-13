/// <reference types="@cloudflare/workers-types" />

// Extend the global CloudflareEnv interface to include our D1 binding "DB"
// This is declared globally (not in a module) so it merges with the declaration
// in @cloudflare/next-on-pages/dist/api/getRequestContext.d.ts

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    JWT_SECRET?: string;
  }
}

export {};
