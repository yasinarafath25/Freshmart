import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// All pages are rendered per request (cart, session and stock must be fresh), so no incremental cache is configured.
// P1: enable the R2 incremental cache for catalog pages (see docs/TRD.md §10).
export default defineCloudflareConfig({});
