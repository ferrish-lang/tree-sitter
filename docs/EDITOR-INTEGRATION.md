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

## Zed handoff plan

This phase does **not** change anything under `zed-extension/`. The current handoff target is already wired in `zed-extension/extension.toml`:

- repository: `https://github.com/ferrish-lang/tree-sitter-ferrish`
- revision: `rev = "main"`

That `rev = "main"` value is only a placeholder. It is risky because Zed would track whatever happens to be on the moving default branch when the grammar is fetched, which makes behavior non-reproducible and can pull in unreviewed parser/query changes.

When Zed is updated later, the follow-up should be:

1. Ensure the desired parser artifacts and query files are committed in `tree-sitter-ferrish`.
2. Choose a specific released commit SHA or tag for the grammar snapshot.
3. Update `zed-extension/extension.toml` to keep the same repository URL but replace `rev = "main"` with that pinned commit or tag.
4. Leave `zed-extension/languages/ferrish/config.toml` focused on language behavior (`.frsh`, brackets, comments, word characters, completion query characters); it does not need to carry grammar revision state.
5. Verify Zed against representative Ferrish samples to confirm highlighting, locals/folds behavior, and indentation still match expectations.

## Practical maintenance rule

Until Zed is explicitly switched to a pinned grammar revision, treat Tree-sitter query changes here as preparatory work for future Zed consumption rather than an active Zed behavior change.
