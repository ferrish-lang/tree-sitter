# tree-sitter-ferrish

Standalone Tree-sitter grammar workspace for Ferrish.

See `docs/EDITOR-INTEGRATION.md` for how Tree-sitter queries relate to the current VS Code/TextMate grammar and for the future Zed handoff plan.

## Scripts

- `npm run generate` — generate parser artifacts from `grammar.js`
- `npm run parse:fixtures` — parse the curated Ferrish fixture subset from `../ferrish-lang/tests/fixtures/inputs/` and print each syntax tree so `ERROR`/`MISSING` nodes stay visible in review
- `npm run parse:fixtures:check` — run the same parse sweep and fail if any `ERROR` or `MISSING` node appears in the output
- `npm test` — run the Tree-sitter corpus tests

## Fixture parsing smoke check

The curated fixture subset is the representative matrix from `docs/GRAMMAR-MAPPING.md`:

- `variable_declaration.frsh`
- `function_declarations.formatted.frsh`
- `structured_types.formatted.frsh`
- `while_loop.formatted.frsh`
- `for_in_loop.frsh`
- `switch_case.frsh`
- `simple_import.frsh`
- `nested_import.formatted.frsh`
- `defer_basic.frsh`
- `ternary_operators.formatted.frsh`
- `json_property_access.formatted.formatted.frsh`

Review flow:

1. Run `npm run parse:fixtures` to print each parse tree.
2. Scan for literal `ERROR` or `MISSING` nodes in the output.
3. Run `npm run parse:fixtures:check` when you want the command to fail on either node kind.

To spot-check the query smoke sample directly:

- `npx tree-sitter parse examples/query-smoke.frsh`
- `npx tree-sitter parse examples/query-smoke.frsh | rg 'ERROR|MISSING'`

## Layout

- `grammar.js` — grammar definition
- `examples/query-smoke.frsh` — real Ferrish sample used for query/highlight smoke checks
- `tree-sitter.json` — Tree-sitter package metadata
- `queries/` — editor query placeholders
- `test/corpus/` — parser corpus fixtures
- `docs/GRAMMAR-MAPPING.md` — source grammar mapping and fixture plan
