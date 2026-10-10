---
name: __PACK_NAME__
description: __PACK_DESCRIPTION__ Keywords: __PACK_KEYWORDS__.
---

# __PACK_NAME__

__PACK_DESCRIPTION__

## Use the SDK

```js
import { summarizeText, dispatchText } from "__NPM_NAME__";

summarizeText("some text");
await dispatchText("some text", { dryRun: true });
```

## Use the CLI

```sh
__PACK_COMMAND__ summary --text "some text"
__PACK_COMMAND__ dispatch --text "some text" --dry-run
```

## Use the MCP server

Start the server with `__PACK_COMMAND__ mcp`. Call `summarize_text`
for stats, `dispatch_text` for routes, `get_cost_report` for costs.

## Rules

- Preview each route with dry run first.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.
