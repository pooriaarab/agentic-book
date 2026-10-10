# __PACK_NAME__ agent guide

__PACK_DESCRIPTION__

## Mental model

Text goes in. Stats or a route receipt come out. One core serves
all three faces, so each face returns the same shape.

## The three faces

- SDK: `import { summarizeText } from "__NPM_NAME__"`.
- CLI: `npx __NPM_NAME__ summary --text "..."`.
- MCP: `npx __NPM_NAME__ mcp`, then call a tool below.

Keywords: __PACK_KEYWORDS__.

## MCP tools

| Tool | Use it for |
| --- | --- |
| summarize_text | Count chars, words, lines, top words. |
| dispatch_text | Route one text. Pass dryRun to preview. |
| get_cost_report | Read session cost totals. |

## The loop

1. Discover the tools with `tools/list`.
2. Run `summarize_text` on a sample.
3. Preview a route with `dispatch_text` and dryRun true.
4. Run the real route when the preview looks right.
5. Read `get_cost_report` and state the cost.

## Rules

- Preview with dry run before each real dispatch.
- Stop when a guard denies the call. State the reason.
- Never retry a denied call with changed text to dodge a guard.
- Report adapter errors as errors. Never present them as success.
- State the cost report before you claim the task is done.
