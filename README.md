# Agentic book

Offer open slots and book meetings across calendar vendors.

## Install

Use Node.js 18 or later.

```sh
npm install agentic-book
```

## Quickstart

Preview is the default. No key is needed for a preview.

```sh
npx agentic-book slots --start 2026-11-01T09:00:00Z --end 2026-11-01T12:00:00Z
npx agentic-book book --slot-start 2026-11-01T09:00:00Z --slot-end 2026-11-01T09:30:00Z --name "Ada Lovelace" --email ada@example.com
npx agentic-book costs
```

Use the SDK with the same JSON shapes.

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

Use it to offer consultation times, schedule customer meetings, and
create internal appointments.

## Live bookings and keys

Add `--live` to book a meeting. Live calls need a vendor and its key.
Missing keys return an error. Vendor errors remain errors.

| Vendor | Environment key | Live booking |
| --- | --- | --- |
| Google Calendar | GOOGLE_CALENDAR_ACCESS_TOKEN | Yes |
| Cal.com | CALCOM_API_KEY | Yes |
| Calendly | CALENDLY_API_TOKEN | Availability only |

```sh
npx agentic-book book --live --vendor google --calendar primary --slot-start 2026-11-01T09:00:00Z --slot-end 2026-11-01T09:30:00Z --name "Ada Lovelace" --email ada@example.com
npx agentic-book book --live --vendor calcom --event-type 123 --slot-start 2026-11-01T09:00:00Z --slot-end 2026-11-01T09:30:00Z --name "Ada Lovelace" --email ada@example.com
```

Calendly exposes availability through its public API but does not
create invitee bookings through that API. Use its scheduling link to
complete a Calendly booking.

## MCP

```sh
npx agentic-book mcp
```

Tools are `find_slots`, `book_meeting`, and `get_cost_report`.
`book_meeting` defaults to `live: false` and uses the same input and
result shapes as the SDK and CLI.

## License

MIT. Copyright Pooria Arab.
