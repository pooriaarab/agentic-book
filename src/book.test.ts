import { describe, expect, test } from "vitest";
import { bookMeeting, findSlots } from "./book.js";
import { getCostReport, resetCosts, VendorError } from "agentic-core";
describe("book", () => {
  const start = "2026-11-01T09:00:00.000Z"; const end = "2026-11-01T10:00:00.000Z";
  test("offers a local preview by default", async () => { const result = await findSlots({ start, end }); expect(result).toMatchObject({ vendor: "google", dryRun: true }); expect(result.slots[0]).toEqual({ start, end: "2026-11-01T09:30:00.000Z" }); });
  test("books a dry run by default", async () => { const receipt = await bookMeeting({ slot: { start, end: "2026-11-01T09:30:00.000Z" }, name: "Ada", email: "ada@example.test" }); expect(receipt).toMatchObject({ dryRun: true, vendor: "google", name: "Ada" }); });
  test("requires a key for a live booking", async () => { await expect(bookMeeting({ live: true, slot: { start, end: "2026-11-01T09:30:00.000Z" }, name: "Ada", email: "ada@example.test" })).rejects.toThrow("GOOGLE_CALENDAR_ACCESS_TOKEN"); });
  test("uses fixture fetch for a live Google booking", async () => { resetCosts(); const fetchFn = async () => new Response(JSON.stringify({ id: "evt_1" }), { status: 200 }); const receipt = await bookMeeting({ live: true, apiKey: "fixture", fetchFn: fetchFn as typeof fetch, slot: { start, end: "2026-11-01T09:30:00.000Z" }, name: "Ada", email: "ada@example.test" }); expect(receipt).toMatchObject({ dryRun: false, bookingId: "evt_1" }); expect(getCostReport().dispatches).toBe(1); });
  test("keeps vendor errors visible", async () => { const fetchFn = async () => new Response("nope", { status: 429, statusText: "Too Many Requests" }); await expect(bookMeeting({ live: true, apiKey: "fixture", fetchFn: fetchFn as typeof fetch, slot: { start, end: "2026-11-01T09:30:00.000Z" }, name: "Ada", email: "ada@example.test" })).rejects.toBeInstanceOf(VendorError); });
});
