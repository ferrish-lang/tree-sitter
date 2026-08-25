# tree-sitter-ferrish

Standalone Tree-sitter grammar for Ferrish.

The canonical source is https://github.com/ferrish-lang/tree-sitter.git. The
npm package name remains `tree-sitter-ferrish`; it does not identify a second
repository.

The verification toolchain is Node `24.18.0` and npm `11.16.0`, declared by
`.node-version` and `package.json`. Use those exact versions for local and CI
verification.

## Verification

Install the locked CLI and run the complete project gate:

```sh
npm ci && npm run verify
```

`verify` runs these checks without installing packages, accessing a sibling
checkout, using the network, or repairing the worktree:

1. `npm run check:generated` — regenerate in an isolated temporary directory
   and compare `src/parser.c`, `src/grammar.json`, and `src/node-types.json`.
2. `npm test` — run the complete Tree-sitter corpus.
3. `npm run parse:fixtures:check` — parse every repository-owned fixture under
   `test/fixtures/valid/` and reject `ERROR` or `MISSING` nodes.
4. `npm run test:fixtures:negative` — verify direct diagnostics for the
   expected parser-failure and missing-root cases.
5. `npm run check:queries` — compile and execute every shipped query against a
   representative Ferrish sample and assert the required captures.

The focused commands are `npm run generate`, `npm test`,
`npm run parse:fixtures:check`, `npm run test:fixtures:negative`,
`npm run check:generated`, and `npm run check:queries`.

## Fixtures and releases

Fixtures are owned by this repository. They cover declarations and types,
functions and control flow, objects and arrays, imports and shell-case syntax,
and literal/interpolated strings. The mapping is documented in
`docs/GRAMMAR-MAPPING.md`. `test/fixtures/negative/` contains parser-failure
sentinels and is intentionally excluded from the passing fixture sweep.

Generated parser output is tracked. Edit `grammar.js`, then run
`npm run generate`; `npm run check:generated` must be clean before committing.

The public qualification procedure is deliberately separate from normal local
verification: a maintainer clones the canonical HTTPS repository into an empty
directory without credentials, resolves the qualifying full 40-character SHA,
checks out that SHA detached, and records the green gate output. Consumers must
pin that exact SHA, never a branch, tag, local checkout, SSH URL, or generated
fallback.

To update a grammar revision, change `grammar.js` or query files, regenerate,
run `npm ci && npm run verify`, commit the qualified revision, and have the
consumer update to the new public full SHA only after anonymous HTTPS fetch
verification. P12 owns its isolated Zed query/build verifier and manual dev-
extension smoke check; P09 owns later canonical documentation publication.

## Layout

- `grammar.js` — grammar definition
- `src/parser.c`, `src/grammar.json`, `src/node-types.json` — generated artifacts
- `examples/query-smoke.frsh` — representative query sample
- `test/fixtures/valid/` — repository-owned parser fixtures
- `test/fixtures/negative/` — expected parser-failure fixtures
- `tree-sitter.json` — Tree-sitter package metadata
- `queries/` — editor queries for highlights, locals, folds, and indents
- `docs/EDITOR-INTEGRATION.md` — editor and immutable-consumer guidance
- `docs/GRAMMAR-MAPPING.md` — syntax and fixture mapping
