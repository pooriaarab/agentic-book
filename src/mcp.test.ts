import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createMcpServer } from "./mcp.js";
const text = (value: unknown) => (value as { content: Array<{ text: string }> }).content[0].text;
describe("mcp", () => test("uses the same booking shapes", async () => { const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair(); const server = createMcpServer(); await server.connect(serverTransport); const client = new Client({ name: "test", version: "0" }); await client.connect(clientTransport); try { expect((await client.listTools()).tools.map((tool) => tool.name).sort()).toEqual(["book_meeting", "find_slots", "get_cost_report"]); const result = await client.callTool({ name: "book_meeting", arguments: { slot: { start: "2026-11-01T09:00:00Z", end: "2026-11-01T09:30:00Z" }, name: "Ada", email: "ada@example.test" } }); expect(JSON.parse(text(result))).toMatchObject({ dryRun: true }); } finally { await client.close(); await server.close(); } }));
