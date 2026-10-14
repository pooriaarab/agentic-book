# agentic-book agent guide

Offer open slots and book meetings across calendar vendors.

## The three faces

- SDK: `import { findSlots, bookMeeting } from "agentic-book"`.
- CLI: `npx agentic-book slots --start <ISO> --end <ISO>`.
- MCP: `npx agentic-book mcp`.

## MCP tools

| Tool | Use it for |
| --- | --- |
| find_slots | Offer available meeting times. |
| book_meeting | Preview or create one meeting. |
| get_cost_report | Read session cost totals. |

## Rules

- Preview first. `live` is false by default.
- Surface guard and vendor errors as errors.
- A missing key is an error for live requests.
- Calendly availability does not create an invitee booking.
