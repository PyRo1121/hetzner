import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type FileSpec = { name: string; url: string; tag?: string; blobSha?: string };

const DEFAULT_FILES: FileSpec[] = [
  { name: "craftingmodifiers.json", url: "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/craftingmodifiers.json" },
  { name: "gamedata.json", url: "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/gamedata.json" },
  { name: "festivities.json", url: "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/festivities.json" },
  { name: "factionwarfare.json", url: "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/factionwarfare.json" },
  { name: "expeditions.json", url: "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/expeditions.json" },
  { name: "eventbasedpopups.json", url: "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/eventbasedpopups.json" },
  { name: "albionjournal.json", url: "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/albionjournal.json" },
];

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getSupabaseClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAndStoreFile(supabase: ReturnType<typeof createClient>, spec: FileSpec) {
  const res = await fetch(spec.url, {
    headers: {
      // Explicit headers to reduce chance of throttling
      "User-Agent": "AlbionInsights/1.0 (+https://albioninsights.app)",
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) throw new Error(`Fetch failed ${spec.name}: ${res.status}`);
  const text = await res.text();
  const sha = spec.blobSha || (await sha256Hex(text));

  // Parse JSON safely (these dumps are large; avoid double parsing where possible)
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON parse failed for ${spec.name}: ${(e as Error).message}`);
  }

  const record = {
    filename: spec.name,
    source_url: spec.url,
    sha,
    tag: spec.tag ?? null,
    content: json as Record<string, unknown>,
  };

  const { error } = await supabase
    .from("ao_bins_raw")
    .upsert([record], { onConflict: "filename,sha" });

  if (error) throw new Error(`Upsert failed for ${spec.name}: ${error.message}`);

  return { name: spec.name, sha };
}

function validateCron(req: Request) {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) return true; // optional
  const header = req.headers.get("x-cron-secret");
  return header === cronSecret;
}

type GitTreeItem = { path: string; type: "blob" | "tree"; sha: string };
async function listJsonFilesFromRepo(): Promise<FileSpec[]> {
  const token = Deno.env.get("GITHUB_TOKEN");
  const res = await fetch(
    "https://api.github.com/repos/ao-data/ao-bin-dumps/git/trees/master?recursive=1",
    {
      headers: {
        "User-Agent": "AlbionInsights/1.0",
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!res.ok) throw new Error(`GitHub tree fetch failed: ${res.status}`);
  const json = await res.json();
  const tree = (json?.tree || []) as GitTreeItem[];
  const files = tree.filter((t) => t.type === "blob" && t.path.endsWith(".json"));
  return files.map((f) => ({
    name: f.path,
    url: `https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/${f.path}`,
    blobSha: f.sha,
  }));
}

async function processInBatches<T>(items: T[], batchSize: number, handler: (chunk: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await handler(chunk);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  if (!validateCron(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const supabase = getSupabaseClient();

  let bodyFiles: string[] | undefined;
  let fetchAll = false;
  let limit = 50;
  let offset = 0;
  let concurrency = 4;
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.files)) bodyFiles = body.files;
    if (body?.all === true) fetchAll = true;
    if (typeof body?.limit === "number") limit = Math.max(1, Math.min(500, body.limit));
    if (typeof body?.offset === "number") offset = Math.max(0, body.offset);
    if (typeof body?.concurrency === "number") concurrency = Math.max(1, Math.min(8, body.concurrency));
  } catch (_) {
    // ignore body parsing errors; default to full FILES set
  }

  let targetFiles: FileSpec[] = [];
  if (fetchAll) {
    const all = await listJsonFilesFromRepo();
    const slice = all.slice(offset, offset + limit);
    targetFiles = slice;
  } else {
    const base = DEFAULT_FILES;
    targetFiles = bodyFiles && bodyFiles.length > 0
      ? base.filter((f) => bodyFiles!.includes(f.name))
      : base;
  }

  const results: Array<{ name: string; sha?: string; error?: string }> = [];
  let inserted = 0;
  let failed = 0;

  await processInBatches(targetFiles, concurrency, async (chunk) => {
    await Promise.all(
      chunk.map(async (spec) => {
        try {
          const r = await fetchAndStoreFile(supabase, spec);
          results.push({ name: r.name, sha: r.sha });
          inserted += 1;
        } catch (e) {
          results.push({ name: spec.name, error: (e as Error).message });
          failed += 1;
        }
      }),
    );
  });

  const summary = {
    total: targetFiles.length,
    inserted,
    failed,
    results,
    params: { fetchAll, limit, offset, concurrency },
  };

  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
    status: failed > 0 ? 207 : 200, // 207: multi-status
  });
});