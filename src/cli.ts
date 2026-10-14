#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { getCostReport, GuardError, VendorError } from "agentic-core";
import { bookMeeting, findSlots, type AvailabilityRequest, type BookingRequest } from "./book.js";
import { DEFAULT_BRAND } from "./index.js";
import { VERSION } from "./version.js";

export class UsageError extends Error { constructor(message: string) { super(message); this.name = "UsageError"; } }
export interface CliRequest extends Partial<BookingRequest> { command: "slots" | "book" | "costs" | "mcp" | "help" | "version"; }
const flags = { "--vendor": "vendor", "--start": "start", "--end": "end", "--duration": "durationMinutes", "--calendar": "calendarId", "--event-type": "eventTypeId", "--event-type-uri": "eventTypeUri", "--slot-start": "slotStart", "--slot-end": "slotEnd", "--name": "name", "--email": "email", "--title": "title", "--notes": "notes" } as const;
export function parseArgs(argv: string[]): CliRequest {
  const args = [...argv]; const first = args.shift() ?? "help";
  const command = first === "--help" || first === "-h" ? "help" : first === "--version" || first === "-V" ? "version" : first;
  if (!["slots", "book", "costs", "mcp", "help", "version"].includes(command)) throw new UsageError(`unknown command "${first}"`);
  const req: CliRequest = { command: command as CliRequest["command"], vendor: "google", live: false };
  while (args.length) { const flag = args.shift()!; if (flag === "--live" && command === "book") { req.live = true; continue; } if (!(flag in flags) || !["slots", "book"].includes(command)) throw new UsageError(`unknown flag "${flag}"`); const value = args.shift(); if (!value || value.startsWith("--")) throw new UsageError(`${flag} needs a value`); if (flag === "--duration") { const n = Number(value); if (!Number.isInteger(n) || n < 1) throw new UsageError("--duration needs a positive integer"); req.durationMinutes = n; } else if (flag === "--slot-start" || flag === "--slot-end") { const slot = req.slot ?? { start: "", end: "" }; slot[flag === "--slot-start" ? "start" : "end"] = value; req.slot = slot; } else Object.assign(req, { [flags[flag as keyof typeof flags]]: value }); }
  if (command === "slots" && (!req.start || !req.end)) throw new UsageError("slots needs --start and --end");
  if (command === "book" && (!req.slot?.start || !req.slot.end || !req.name || !req.email)) throw new UsageError("book needs --slot-start, --slot-end, --name, and --email");
  return req;
}
export interface CliIo { out(line: string): void; err(line: string): void; fetchFn?: typeof fetch; now?: () => Date; }
const defaultIo: CliIo = { out: (line) => console.log(line), err: (line) => console.error(line) };
export function helpText(): string { return `Agentic book ${VERSION}\n${DEFAULT_BRAND.description}\n\nUsage: agentic-book <command> [flags]\nCommands: slots, book, costs, mcp, help, version\nslots --start <ISO> --end <ISO> [--vendor google|calcom|calendly]\nbook --slot-start <ISO> --slot-end <ISO> --name <name> --email <email> [--live]\n  --vendor google|calcom|calendly --calendar <id> --event-type <id>\ncosts: Print session cost JSON.\nmcp: Start MCP on stdio.`; }
export async function runCli(argv: string[], io: CliIo = defaultIo): Promise<number> {
  let req: CliRequest; try { req = parseArgs(argv); } catch (error) { io.err(`UsageError: ${error instanceof Error ? error.message : String(error)}`); return 2; }
  try { switch (req.command) { case "help": io.out(helpText()); break; case "version": io.out(VERSION); break; case "costs": io.out(JSON.stringify(getCostReport())); break; case "mcp": await (await import("./mcp.js")).startMcp(); break; case "slots": io.out(JSON.stringify(await findSlots({ ...req, start: req.start!, end: req.end!, fetchFn: io.fetchFn } as AvailabilityRequest))); break; case "book": io.out(JSON.stringify(await bookMeeting({ ...req, slot: req.slot!, name: req.name!, email: req.email!, fetchFn: io.fetchFn, now: io.now } as BookingRequest))); break; } return 0; } catch (error) { if (error instanceof GuardError || error instanceof VendorError) { io.err(`${error.name}: ${error.message}`); return 1; } throw error; }
}
function isMainModule(): boolean { try { return typeof process.argv[1] === "string" && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; } }
if (isMainModule()) runCli(process.argv.slice(2)).then((code) => { if (code) process.exit(code); }, (error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
