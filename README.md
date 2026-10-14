# Agentic book

Agentic book offers open slots and books meetings with Google Calendar, Cal.com, and Calendly. Use it from a CLI, an MCP agent, or the SDK.

## Install

Use Node.js 18 or later.

```sh
npm install agentic-book
```

## Quickstart

The default command is a dry run. It exits 0. It does not use the network.

```sh
npx agentic-book slots --start 2026-11-01T09:00:00Z --end 2026-11-01T12:00:00Z
npx agentic-book book --slot-start 2026-11-01T09:00:00Z --slot-end 2026-11-01T09:30:00Z --name "Ada Lovelace" --email ada@example.com
npx agentic-book costs
```

## Vendors

Live commands need the listed environment key. Calendly offers availability only.

| Brand | Environment key | Live command |
| --- | --- | --- |
| Google Calendar | `GOOGLE_CALENDAR_ACCESS_TOKEN` | `npx agentic-book book --live --vendor google --calendar primary --slot-start 2026-11-01T09:00:00Z --slot-end 2026-11-01T09:30:00Z --name "Ada Lovelace" --email ada@example.com` |
| Cal.com | `CALCOM_API_KEY` | `npx agentic-book book --live --vendor calcom --event-type 123 --slot-start 2026-11-01T09:00:00Z --slot-end 2026-11-01T09:30:00Z --name "Ada Lovelace" --email ada@example.com` |
| Calendly | `CALENDLY_API_TOKEN` | `npx agentic-book slots --vendor calendly --event-type-uri https://api.calendly.com/event_types/UUID --start 2026-11-01T09:00:00Z --end 2026-11-01T12:00:00Z` |

Calendly does not create invitee bookings through its public API. Use its scheduling link to complete a Calendly booking.

## SDK

Use the SDK with the same input shapes.

```js
import { findSlots, bookMeeting } from "agentic-book";

const slots = await findSlots({
  start: "2026-11-01T09:00:00Z",
  end: "2026-11-01T12:00:00Z",
});

const receipt = await bookMeeting({
  slot: slots.slots[0],
  name: "Ada Lovelace",
  email: "ada@example.com",
});
```

## MCP

```sh
npx agentic-book mcp
```

Tools are `find_slots`, `book_meeting`, and `get_cost_report`. `book_meeting` defaults to `live: false`.

## License

MIT. Copyright Pooria Arab.
