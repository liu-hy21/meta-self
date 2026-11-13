export type PersonaMemoryProvider = "local" | "supermemory";

export type PersonaMemoryDocument = {
  id: string;
  content: string;
  metadata?: Record<string, string | number | boolean>;
};

export type PersonaMemoryHit = {
  id?: string;
  text: string;
  score?: number;
  provider: PersonaMemoryProvider;
};

export interface PersonaMemoryBackend {
  readonly name: PersonaMemoryProvider;
  ingest(namespace: string, documents: PersonaMemoryDocument[]): Promise<void>;
  search(namespace: string, query: string, limit?: number): Promise<PersonaMemoryHit[]>;
}

const localPersonaMemoryBackend: PersonaMemoryBackend = {
  name: "local",
  async ingest() {},
  async search() { return []; },
};

type SupermemoryBackendOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

type SupermemoryResult = {
  id?: unknown;
  memory?: unknown;
  chunk?: unknown;
  score?: unknown;
};

function baseUrl(value: string | undefined) {
  return (value || "https://api.supermemory.ai").replace(/\/$/, "");
}

async function responseJson(response: Response) {
  if (!response.ok) throw new Error(`记忆服务请求失败（${response.status}）。`);
  return response.json() as Promise<{ results?: SupermemoryResult[] }>;
}

export function createSupermemoryBackend({ apiKey, baseUrl: configuredBaseUrl, fetchImpl = fetch }: SupermemoryBackendOptions): PersonaMemoryBackend {
  const root = baseUrl(configuredBaseUrl);
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const endpoint = (namespace: string, action: "document" | "search") => `${root}/ns/${encodeURIComponent(namespace)}/${action}`;
  return {
    name: "supermemory",
    async ingest(namespace, documents) {
      for (const document of documents) {
        const response = await fetchImpl(endpoint(namespace, "document"), { method: "POST", headers, body: JSON.stringify(document) });
        await responseJson(response);
      }
    },
    async search(namespace, query, limit = 6) {
      const response = await fetchImpl(endpoint(namespace, "search"), { method: "POST", headers, body: JSON.stringify({ query, searchMode: "hybrid", limit }) });
      const body = await responseJson(response);
      return (body.results ?? []).flatMap((result) => {
        const text = typeof result.memory === "string" ? result.memory : typeof result.chunk === "string" ? result.chunk : "";
        if (!text) return [];
        return [{ id: typeof result.id === "string" ? result.id : undefined, text, score: typeof result.score === "number" ? result.score : undefined, provider: "supermemory" as const }];
      });
    },
  };
}

export function getPersonaMemoryBackend(env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch): PersonaMemoryBackend {
  const apiKey = env.SUPERMEMORY_API_KEY?.trim();
  if (!apiKey) return localPersonaMemoryBackend;
  return createSupermemoryBackend({ apiKey, baseUrl: env.SUPERMEMORY_BASE_URL, fetchImpl });
}
