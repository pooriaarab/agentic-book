import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createLogger, GuardError, VendorError, getCostReport, type Guards, type Logger } from "agentic-core";
import { bookMeeting, findSlots } from "./book.js";
import { DEFAULT_BRAND } from "./index.js";
export interface McpDeps { guards?: Guards; logger?: Logger; fetchFn?: typeof fetch; now?: () => Date; }
const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
const vendor = z.enum(["google", "calcom", "calendly"]).default("google");
export function createMcpServer(deps: McpDeps = {}): McpServer { const server = new McpServer({ name: DEFAULT_BRAND.command, version: DEFAULT_BRAND.version });
  server.registerTool("find_slots", { description: "Offer open meeting slots. This is a preview when no vendor key is configured.", inputSchema: { vendor, start: z.string(), end: z.string(), durationMinutes: z.number().int().positive().optional(), calendarId: z.string().optional(), eventTypeId: z.union([z.string(), z.number()]).optional(), eventTypeUri: z.string().optional() }, annotations: { readOnlyHint: true } }, async (input) => { try { return result(await findSlots({ ...input, fetchFn: deps.fetchFn })); } catch (error) { if (error instanceof VendorError) return { ...result({ error: error.message }), isError: true }; throw error; } });
  server.registerTool("book_meeting", { description: "Preview a meeting booking. Set live true to book it with Google Calendar or Cal.com.", inputSchema: { vendor, slot: z.object({ start: z.string(), end: z.string() }), name: z.string(), email: z.string(), title: z.string().optional(), notes: z.string().optional(), calendarId: z.string().optional(), eventTypeId: z.union([z.string(), z.number()]).optional(), eventTypeUri: z.string().optional(), live: z.boolean().default(false) }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } }, async (input) => { try { return result(await bookMeeting({ ...input, guards: deps.guards, logger: deps.logger ?? createLogger({ quiet: true }), fetchFn: deps.fetchFn, now: deps.now })); } catch (error) { if (error instanceof GuardError || error instanceof VendorError) return { ...result({ error: error.message }), isError: true }; throw error; } });
  server.registerTool("get_cost_report", { description: "Read session cost totals.", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => result(getCostReport())); return server; }
export async function startMcp(deps: McpDeps = {}): Promise<void> { await createMcpServer(deps).connect(new StdioServerTransport()); }
