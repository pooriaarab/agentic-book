import { randomUUID } from "node:crypto";
import {
  createGuards,
  createLogger,
  recordCost,
  GuardError,
  VendorError,
  type Guards,
  type GuardsConfig,
  type Logger,
} from "agentic-core";

export type BookingVendor = "google" | "calcom" | "calendly";

export interface TimeSlot {
  start: string;
  end: string;
}

export interface AvailabilityRequest {
  vendor?: BookingVendor;
  start: string;
  end: string;
  durationMinutes?: number;
  calendarId?: string;
  eventTypeId?: string | number;
  eventTypeUri?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
}

export interface BookingRequest extends Omit<Partial<AvailabilityRequest>, "vendor"> {
  vendor?: BookingVendor;
  slot: TimeSlot;
  name: string;
  email: string;
  title?: string;
  notes?: string;
  live?: boolean;
  guards?: Guards;
  logger?: Logger;
  now?: () => Date;
}

export interface AvailabilityResult {
  vendor: BookingVendor;
  slots: TimeSlot[];
  dryRun: boolean;
}

export interface BookingReceipt {
  vendor: BookingVendor;
  bookingId: string;
  slot: TimeSlot;
  name: string;
  email: string;
  dryRun: boolean;
  at: string;
}

export function createBookingGuards(options: GuardsConfig = {}): Guards {
  return createGuards(options);
}

function validDate(value: string, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new VendorError(`${label} must be an ISO date-time`);
  return date;
}

function validateWindow(start: string, end: string): void {
  if (validDate(end, "end").getTime() <= validDate(start, "start").getTime()) {
    throw new VendorError("end must be after start");
  }
}

function validateSlot(slot: TimeSlot): void {
  validateWindow(slot.start, slot.end);
}

function requireKey(vendor: BookingVendor, apiKey?: string): string {
  const keys: Record<BookingVendor, string> = {
    google: "GOOGLE_CALENDAR_ACCESS_TOKEN",
    calcom: "CALCOM_API_KEY",
    calendly: "CALENDLY_API_TOKEN",
  };
  const key = apiKey ?? process.env[keys[vendor]];
  if (!key) throw new VendorError(`${vendor} live requests need ${keys[vendor]}`);
  return key;
}

function previewSlots(req: AvailabilityRequest): TimeSlot[] {
  validateWindow(req.start, req.end);
  const duration = req.durationMinutes ?? 30;
  if (!Number.isInteger(duration) || duration < 1) {
    throw new VendorError("durationMinutes must be an integer of 1 or more");
  }
  const start = validDate(req.start, "start");
  const end = validDate(req.end, "end");
  const stop = new Date(start.getTime() + duration * 60_000);
  return stop.getTime() <= end.getTime()
    ? [{ start: start.toISOString(), end: stop.toISOString() }]
    : [];
}

async function requestJson(
  url: string,
  init: RequestInit,
  fetchFn: typeof fetch,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchFn(url, init);
  } catch (error) {
    throw new VendorError(`vendor request failed: ${String(error)}`, { cause: error });
  }
  const body = await response.text();
  if (!response.ok) {
    throw new VendorError(`vendor returned ${response.status}: ${body || response.statusText}`, {
      status: response.status,
    });
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new VendorError("vendor returned invalid JSON");
  }
}

function googleSlots(body: unknown): TimeSlot[] {
  const calendars = (body as { calendars?: Record<string, { busy?: TimeSlot[] }> }).calendars;
  return calendars ? Object.values(calendars).flatMap((calendar) => calendar.busy ?? []) : [];
}

export async function findSlots(req: AvailabilityRequest): Promise<AvailabilityResult> {
  const vendor = req.vendor ?? "google";
  const preview = previewSlots(req);
  if (!req.apiKey && !process.env[{ google: "GOOGLE_CALENDAR_ACCESS_TOKEN", calcom: "CALCOM_API_KEY", calendly: "CALENDLY_API_TOKEN" }[vendor]]) {
    return { vendor, slots: preview, dryRun: true };
  }
  const key = requireKey(vendor, req.apiKey);
  const fetchFn = req.fetchFn ?? fetch;
  if (vendor === "google") {
    const body = await requestJson(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ timeMin: req.start, timeMax: req.end, items: [{ id: req.calendarId ?? "primary" }] }),
      },
      fetchFn,
    );
    return { vendor, slots: googleSlots(body), dryRun: false };
  }
  if (vendor === "calcom") {
    const body = await requestJson(
      `https://api.cal.com/v2/slots?eventTypeId=${encodeURIComponent(String(req.eventTypeId ?? ""))}&startTime=${encodeURIComponent(req.start)}&endTime=${encodeURIComponent(req.end)}`,
      { headers: { authorization: `Bearer ${key}` } },
      fetchFn,
    );
    const slots = (body as { data?: { slots?: Record<string, Array<{ time: string }>> } }).data?.slots ?? {};
    return { vendor, slots: Object.values(slots).flat().map(({ time }) => ({ start: time, end: time })), dryRun: false };
  }
  const body = await requestJson(
    `https://api.calendly.com/event_type_available_times?event_type=${encodeURIComponent(req.eventTypeUri ?? "")}&start_time=${encodeURIComponent(req.start)}&end_time=${encodeURIComponent(req.end)}`,
    { headers: { authorization: `Bearer ${key}` } },
    fetchFn,
  );
  const collection = (body as { collection?: Array<{ start_time: string; end_time: string }> }).collection ?? [];
  return { vendor, slots: collection.map(({ start_time, end_time }) => ({ start: start_time, end: end_time })), dryRun: false };
}

export async function bookMeeting(req: BookingRequest): Promise<BookingReceipt> {
  const vendor = req.vendor ?? "google";
  validateSlot(req.slot);
  if (!req.name.trim() || !req.email.trim()) throw new VendorError("name and email are required");
  const guards = req.guards ?? createBookingGuards({ now: req.now });
  guards.checkDispatch(`${req.name} ${req.email} ${req.title ?? ""}`);
  const at = (req.now?.() ?? new Date()).toISOString();
  if (req.live !== true) {
    return { vendor, bookingId: `preview_${randomUUID()}`, slot: req.slot, name: req.name, email: req.email, dryRun: true, at };
  }
  const key = requireKey(vendor, req.apiKey);
  const fetchFn = req.fetchFn ?? fetch;
  let body: unknown;
  if (vendor === "google") {
    body = await requestJson(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(req.calendarId ?? "primary")}/events`,
      { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ summary: req.title ?? "Meeting", description: req.notes, start: { dateTime: req.slot.start }, end: { dateTime: req.slot.end }, attendees: [{ email: req.email, displayName: req.name }] }) },
      fetchFn,
    );
  } else if (vendor === "calcom") {
    body = await requestJson(
      "https://api.cal.com/v2/bookings",
      { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ eventTypeId: req.eventTypeId, start: req.slot.start, attendee: { name: req.name, email: req.email }, metadata: { notes: req.notes } }) },
      fetchFn,
    );
  } else {
    throw new VendorError("Calendly does not support creating invitee bookings through its public API");
  }
  const value = body as { id?: string; data?: { id?: string; uid?: string } };
  const bookingId = String(value.id ?? value.data?.id ?? value.data?.uid ?? randomUUID());
  guards.recordDispatch();
  recordCost({ kind: "dispatch", adapter: vendor, units: 1 });
  req.logger?.info(`booked meeting via ${vendor}`);
  return { vendor, bookingId, slot: req.slot, name: req.name, email: req.email, dryRun: false, at };
}
