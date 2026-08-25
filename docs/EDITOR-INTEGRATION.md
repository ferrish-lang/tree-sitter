## Editor integration

Ferrish currently has two editor-highlighting tracks:

1. **VS Code / TextMate today** — the VS Code extension contributes `syntaxes/ferrish.tmLanguage.json` under the `source.ferrish` scope. That TextMate grammar drives token coloring in VS Code today.
2. **Tree-sitter consumers** — this repository now ships `queries/highlights.scm`, `queries/locals.scm`, `queries/folds.scm`, and `queries/indents.scm`. Those queries are for editors and tools that load the Ferrish Tree-sitter grammar directly.

These tracks should stay semantically aligned, but they are not the same artifact:

- changing Tree-sitter queries does **not** automatically update VS Code highlighting
- changing the TextMate grammar does **not** automatically update Tree-sitter captures
- both should continue to agree on the broad category a Ferrish construct belongs to (keyword, string, comment, type, function, property, etc.)

## Scope and naming expectations

- The Tree-sitter grammar metadata uses `scope = "source.ferrish"` in `tree-sitter.json`.
- The VS Code extension also uses `scopeName = "source.ferrish"`.

Keeping that scope aligned makes it easier to reason about Ferrish highlighting across editors even though the underlying tokenization systems differ.

The shipped query families are `highlights.scm`, `locals.scm`, `folds.scm`,
and `indents.scm`. `npm run check:queries` compiles each query with the local
Tree-sitter CLI and checks representative captures; it does not inspect query
text or substitute a consumer's query set.

## Zed handoff plan

This repository is the canonical grammar publisher. P11 does **not** change
anything under `zed-extension/`; the consumer handoff is an immutable public
revision from this repository:

- repository: `https://github.com/ferrish-lang/tree-sitter.git`
- revision: a full 40-character commit SHA selected by P12

Consumers must not use a branch, tag, local checkout, SSH URL, cache, or
generated fallback. The qualifying revision is selected only after the
publisher gate and an unauthenticated HTTPS fetch of the detached commit pass.

When Zed is updated later, the follow-up should be:

1. Ensure the desired parser artifacts and query files are committed in
   `https://github.com/ferrish-lang/tree-sitter.git`.
2. Choose a qualifying full commit SHA after the publisher's local gate and
   anonymous HTTPS fetch pass.
3. Update the consumer manifest to keep the canonical repository URL and pin
   that exact SHA.
4. Leave `zed-extension/languages/ferrish/config.toml` focused on language behavior (`.frsh`, brackets, comments, word characters, completion query characters); it does not need to carry grammar revision state.
5. Run P12's isolated fetched-grammar query/build verifier and its documented
   manual Zed dev-extension smoke check against representative Ferrish samples.

## Practical maintenance rule

Until P12 explicitly switches to a pinned grammar revision, treat Tree-sitter
query changes here as publisher output rather than an active Zed behavior
change. This publisher does not claim hosted required-check or public-fetch
evidence until a maintainer performs those HITL steps.
