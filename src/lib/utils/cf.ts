import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare bindings when running on Workers; undefined in plain Node. */
export function getCfEnv(): CloudflareEnv | undefined {
  try {
    return getCloudflareContext().env as CloudflareEnv;
  } catch {
    return undefined;
  }
}
