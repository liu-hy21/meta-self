import assert from "node:assert/strict";
import { createSupermemoryBackend, getPersonaMemoryBackend } from "../src/lib/relation/persona-memory";

async function main() {
  const local = getPersonaMemoryBackend({});
  assert.equal(local.name, "local");
  await local.ingest("persona:test", []);
  assert.deepEqual(await local.search("persona:test", "周末"), []);

  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify({ results: [{ id: "memory-1", memory: "周末去过奥莱", score: 0.91 }, { id: "chunk-1", chunk: "原始消息：周末去奥莱", score: 0.87 }] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const remote = createSupermemoryBackend({ apiKey: "test-key", baseUrl: "https://memory.example", fetchImpl });
  await remote.ingest("persona:bc", [{ id: "session-1", content: "bc: 周末去奥莱", metadata: { role: "other" } }]);
  const hits = await remote.search("persona:bc", "周末去哪", 4);
  assert.equal(remote.name, "supermemory");
  assert.equal(hits[0]?.text, "周末去过奥莱");
  assert.equal(hits[1]?.text, "原始消息：周末去奥莱");
  assert.equal(calls[0]?.url, "https://memory.example/ns/persona%3Abc/document");
  assert.equal(calls[1]?.url, "https://memory.example/ns/persona%3Abc/search");
  assert.equal((calls[1]?.init?.headers as Record<string, string>).Authorization, "Bearer test-key");
  console.log("PASS persona memory: local default, provider selection, Supermemory contract");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
