# agentic-book

[![npm version](https://img.shields.io/npm/v/agentic-book)](https://www.npmjs.com/package/agentic-book) [![Downloads/month](https://img.shields.io/npm/dm/agentic-book)](https://www.npmjs.com/package/agentic-book) [![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

agentic-book is an open-source Node.js calendar API wrapper with booking previews, Google Calendar and Cal.com creation requests, and Calendly availability requests.

## Install

```sh
npm install agentic-book
```

Use Node.js 18 or later. TypeScript declarations are included; the package has three direct runtime dependencies.

## Preview a meeting

No credentials or environment variables are required. Booking defaults to preview, even when credentials exist.

```sh
npx agentic-book book --slot-start 2026-11-01T09:00:00Z --slot-end 2026-11-01T09:30:00Z --name "Ada Lovelace" --email ada@example.com
```

The JSON receipt contains `dryRun: true` and a `bookingId` beginning with `preview_`. No calendar event is created.

```js
import { bookMeeting } from 'agentic-book';

const receipt = await bookMeeting({
  slot: { start: '2026-11-01T09:00:00Z', end: '2026-11-01T09:30:00Z' },
  name: 'Ada Lovelace', email: 'ada@example.com',
});
console.log(receipt.dryRun, receipt.bookingId);
```

## Features and coverage

- **Booking requests:** create Google Calendar events or send Cal.com booking requests after explicit live selection.
- **Previews:** simulate a booking, or return one candidate slot when availability credentials are absent.
- **Guards:** apply caps, quiet hours, and blocklists to booking requests through a shared SDK guard instance.
- **Receipts:** expose vendor, slot, participant fields, booking ID, timestamp, and preview status.

The dispatcher has three vendors. Live credential checks remain pending; local tests use mocked HTTP responses.

| Integration | Availability behavior | Live booking | Environment variable |
| --- | --- | --- | --- |
| Google Calendar (`google`) | Partial: returns busy intervals, not open slots | Event creation request | `GOOGLE_CALENDAR_ACCESS_TOKEN` |
| Cal.com (`calcom`) | Partial: mapped slots have identical start and end | Booking creation request | `CALCOM_API_KEY` |
| Calendly (`calendly`) | Availability response mapping | Unsupported by this package | `CALENDLY_API_TOKEN` |

## Runtime surfaces

SDK entry points are `findSlots`, `bookMeeting`, and `createBookingGuards`, plus core logging, guard, and cost exports.
CLI commands are `slots`, `book`, `costs`, `mcp`, `help`, and `version`.
Help aliases are `--help` and `-h`; version aliases are `--version` and `-V`.
The Model Context Protocol (MCP) tools are `find_slots`, `book_meeting`, and `get_cost_report`.
Start stdio with `npx agentic-book mcp` or the `agentic-book-mcp` binary.
The Worker source is a text-summary scaffold with `GET /health` and `POST /summarize`; it does not serve booking routes.

## Behavior limits and setup

Export keys through your shell or secret store. The package does not automatically load `.env` files or refresh Google access tokens.
`findSlots` calls the vendor whenever credentials exist; it has no explicit preview flag.
Without credentials, its candidate ignores real calendar conflicts. Do not treat it as confirmed availability.
Google busy intervals require your own free-time calculation. Cal.com slot results require your own end-time calculation before booking.
Booking does not recheck conflicts, reserve a slot, or supply request idempotency keys.
The request helper has no explicit timeout or retry loop. Google invitations do not set `sendUpdates`.
A successful response without a provider ID receives a generated receipt ID; that ID does not prove a provider booking exists.
Enable booking with `live: true` or `--live` only after authorizing the request and configuring credentials.
Google accepts `calendarId` / `--calendar`; Cal.com needs `eventTypeId` / `--event-type`.
Calendly availability uses `eventTypeUri` / `--event-type-uri`; live booking throws an error in this implementation.
Costs count successful live bookings in process memory, not provider charges. Later CLI processes do not recover earlier totals.

[Google Calendar free/busy reference](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query) · [Cal.com slot reference](https://cal.com/docs/api-reference/v2/slots/get-available-time-slots-for-an-event-type) · [Calendly developer docs](https://developer.calendly.com/) · [Package](https://www.npmjs.com/package/agentic-book) · [Support](https://github.com/pooriaarab/agentic-book/issues)

Version 0.1.1 is an early release; interfaces can change before 1.0. Public case studies are not yet published in this repository.

## License

MIT. Copyright Pooria Arab.
