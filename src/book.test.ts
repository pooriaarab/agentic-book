import { describe, expect, test } from "vitest";
import { bookMeeting, findSlots } from "./book.js";
import { getCostReport, resetCosts, VendorError } from "agentic-core";

describe("book", () => {
  const start = "2026-11-01T09:00:00.000Z";
  const end = "2026-11-01T10:00:00.000Z";
  const slot = { start, end: "2026-11-01T09:30:00.000Z" };

  test("offers a local preview by default", async () => {
    const result = await findSlots({ start, end });
    expect(result).toMatchObject({ vendor: "google", dryRun: true });
    expect(result.slots[0]).toEqual(slot);
  });

  test("books a dry run by default", async () => {
    const receipt = await bookMeeting({ slot, name: "Ada", email: "ada@example.test" });
    expect(receipt).toMatchObject({ dryRun: true, vendor: "google", name: "Ada" });
  });

  test("requires a key for a live booking", async () => {
    await expect(bookMeeting({ live: true, slot, name: "Ada", email: "ada@example.test" }))
      .rejects.toThrow("GOOGLE_CALENDAR_ACCESS_TOKEN");
  });

  test("uses the Google Calendar HTTPS host for a live booking", async () => {
    resetCosts();
    let url = "";
    const fetchFn = async (input: RequestInfo | URL) => {
      url = String(input);
      return new Response(JSON.stringify({ id: "evt_1" }), { status: 200 });
    };
    const receipt = await bookMeeting({
      live: true, apiKey: "fixture", fetchFn: fetchFn as typeof fetch, slot,
      name: "Ada", email: "ada@example.test",
    });
    expect(url).toMatch(/^https:\/\/www\.googleapis\.com\/calendar\/v3\/calendars\/primary\/events$/);
    expect(receipt).toMatchObject({ dryRun: false, bookingId: "evt_1" });
    expect(getCostReport().dispatches).toBe(1);
  });

  test("uses the Cal.com HTTPS host for a live booking", async () => {
    let url = "";
    const fetchFn = async (input: RequestInfo | URL) => {
      url = String(input);
      return new Response(JSON.stringify({ data: { id: "cal_1" } }), { status: 200 });
    };
    const receipt = await bookMeeting({
      vendor: "calcom", live: true, apiKey: "fixture", fetchFn: fetchFn as typeof fetch,
      eventTypeId: 123, slot, name: "Ada", email: "ada@example.test",
    });
    expect(url).toBe("https://api.cal.com/v2/bookings");
    expect(receipt).toMatchObject({ vendor: "calcom", dryRun: false, bookingId: "cal_1" });
  });

  test("uses the Google Calendar HTTPS host for live availability", async () => {
    let url = "";
    const fetchFn = async (input: RequestInfo | URL) => {
      url = String(input);
      return new Response(JSON.stringify({ calendars: { primary: { busy: [slot] } } }), { status: 200 });
    };
    const result = await findSlots({ start, end, apiKey: "fixture", fetchFn: fetchFn as typeof fetch });
    expect(url).toBe("https://www.googleapis.com/calendar/v3/freeBusy");
    expect(result).toMatchObject({ vendor: "google", dryRun: false, slots: [slot] });
  });

  test("uses the Cal.com HTTPS host for live availability", async () => {
    let url = "";
    const fetchFn = async (input: RequestInfo | URL) => {
      url = String(input);
      return new Response(JSON.stringify({ data: { slots: { day: [{ time: start }] } } }), { status: 200 });
    };
    const result = await findSlots({ vendor: "calcom", start, end, eventTypeId: 123, apiKey: "fixture", fetchFn: fetchFn as typeof fetch });
    expect(url).toMatch(/^https:\/\/api\.cal\.com\/v2\/slots\?/);
    expect(result).toMatchObject({ vendor: "calcom", dryRun: false });
  });

  test("uses the Calendly HTTPS host for live availability", async () => {
    let url = "";
    const fetchFn = async (input: RequestInfo | URL) => {
      url = String(input);
      return new Response(JSON.stringify({ collection: [{ start_time: start, end_time: slot.end }] }), { status: 200 });
    };
    const result = await findSlots({
      vendor: "calendly", start, end, eventTypeUri: "https://api.calendly.com/event_types/UUID",
      apiKey: "fixture", fetchFn: fetchFn as typeof fetch,
    });
    expect(url).toMatch(/^https:\/\/api\.calendly\.com\/event_type_available_times\?/);
    expect(result).toMatchObject({ vendor: "calendly", dryRun: false, slots: [slot] });
  });

  test("keeps vendor errors visible", async () => {
    const fetchFn = async () => new Response("nope", { status: 429, statusText: "Too Many Requests" });
    await expect(bookMeeting({ live: true, apiKey: "fixture", fetchFn: fetchFn as typeof fetch, slot, name: "Ada", email: "ada@example.test" }))
      .rejects.toBeInstanceOf(VendorError);
  });
});
