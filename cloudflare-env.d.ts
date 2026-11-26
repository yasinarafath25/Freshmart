// Bindings declared in wrangler.jsonc. Regenerate with `npm run cf-typegen` once deployed config is final.
interface CloudflareEnv {
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  HYPERDRIVE?: { connectionString: string };
  MEDIA?: {
    get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string }; httpEtag: string } | null>;
    put(key: string, value: ArrayBuffer | ReadableStream, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
    delete(key: string): Promise<void>;
  };
}
