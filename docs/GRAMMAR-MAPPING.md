# Ferrish grammar/source mapping

The canonical grammar source is https://github.com/ferrish-lang/tree-sitter.git.
This document describes the standalone grammar and its repository-owned
fixtures; it does not depend on a sibling checkout.

Status legend:

- **implemented** — present in this repository's `grammar.js`
- **planned** — should exist in this standalone grammar, but is missing or incomplete in the draft
- **deferred** — intentionally postponed for the first standalone grammar cut
- **scanner-risk** — likely needs an external scanner or careful lexical conflict handling

This document maps the current Ferrish syntax to the Tree-sitter CST and records
which query captures are preserved. The standalone fixtures are acceptance
samples, not a copied Rust fixture suite.

## High-level decisions

1. Keep Tree-sitter node names close to pest rule names unless Tree-sitter conventions make a split clearer.
2. Preserve distinct string node kinds: `string_literal`, `single_quoted_string`, `multiline_string`, `string_interpolation`.
3. Keep `console_log_call` as its own node, even though it lowers to `Expression::MethodCall`, because the pest grammar treats it specially and queries can highlight `console`/`log` differently.
4. Model `method_call_statement` as a statement wrapper around `builtin_method_call`; do not rely on newline-only structure disappearing into extras.
5. Treat `source_shebang_statement`, `hash_comment`, and `shell_case_statement` as lexical risk areas, but keep `shell_case_statement` scanner-free unless corpus evidence shows the token island is too brittle.
6. Current decision: no external scanner is needed. The string and shell-case corpus passes with plain lexical rules plus the existing opaque `shell_case_statement` token island.
7. Use literal-token query captures for operators; the named pest operator rules do not need one CST node each.
8. For the base-expression slice, prefer a flat `_expression` choice plus targeted named nodes like `parenthesized_expression`, `array_literal`, and `object_literal` over a public `primary` wrapper node.
9. Model declaration/type syntax with explicit nodes for `parameter`, `type_annotation`, `array_type_suffix`, and `generic_type_suffix`; keep `name`, `type`, `value`, `body`, `parameters`, and `return_type` fields stable across declaration forms.
10. Route postfix syntax through a dedicated `_postfix_expression` layer so calls, member access, and subscripts stay reachable without reintroducing the broken Zed unary/postfix gap.
11. Build the precedence ladder as hidden pass-through rungs plus named operator nodes, so plain identifiers/literals stay flat while `assignment_expression`, `ternary`, `logical_or`, `logical_and`, `equality`, `relational`, `additive`, `multiplicative`, and `unary_expression` only appear when an operator is actually present.
12. Keep update expressions on a narrower `_update_target_expression` subset (`identifier`, `property_access`, `array_access`) so `++`/`--` attach to lvalue-like shapes instead of arbitrary call results, even while generic unary `!` and unary `-` recurse over the wider unary layer.
13. Preserve highlightable call shapes by keeping `console_log_call` and `builtin_method_call` as named nodes with explicit AST-aligned `object`/`method`/`args` fields rather than lowering everything to a generic `function_call(property_access, ...)` form.
14. Treat `{ ... }` as a real `block` statement wherever statement lists are accepted, but keep semicolon requirements on `return`, `exit`, `break`, `continue`, `parallel`, `defer`, declarations, and ordinary `expression_statement` aligned with `grammar.pest`.
15. Match pest's special `exit` syntax by accepting both `exit value;` and `exit(value);`, and bias the explicit-parentheses form so `exit(value);` attaches the inner expression directly as the `value` child instead of surfacing an extra `parenthesized_expression` node.

## Standalone fixture matrix

The passing parser sweep discovers every `.frsh` file under
`test/fixtures/valid/`. These compact samples are owned by this repository and
are intentionally independent of any sibling checkout.

| Syntax family | Fixture | Why this fixture is in the representative set |
| --- | --- | --- |
| declarations + types | `test/fixtures/valid/declarations-and-types.frsh` | Interfaces, records, typed bindings, object and array literals, single/interpolated strings, and property access. |
| functions + control flow | `test/fixtures/valid/functions-and-control-flow.frsh` | Functions, parameters, returns, if/else, loops, switch, `defer`, and updates. |
| imports + shell case | `test/fixtures/valid/imports-and-shell-case.frsh` | Legacy and default imports plus the supported opaque shell-case form. |
| objects + arrays + strings | `test/fixtures/valid/objects-arrays-and-strings.frsh` | Generic types, object/array access, double/single/multiline/interpolated strings. |
| negative parser behavior | `test/fixtures/negative/missing-semicolon.frsh` | Expected `ERROR`/`MISSING` sentinel; checked separately from passing fixtures. |

### Coverage summary by major syntax family

| Major syntax family | Representative fixture(s) |
| --- | --- |
| declarations | `declarations-and-types.frsh` |
| functions | `functions-and-control-flow.frsh` |
| structured types | `declarations-and-types.frsh` |
| loops | `functions-and-control-flow.frsh` |
| switch/case | `functions-and-control-flow.frsh` |
| imports | `imports-and-shell-case.frsh` |
| defer | `functions-and-control-flow.frsh` |
| arrays/objects | `declarations-and-types.frsh`, `objects-arrays-and-strings.frsh` |
| literals | `declarations-and-types.frsh`, `objects-arrays-and-strings.frsh` |
| property access | `declarations-and-types.frsh`, `objects-arrays-and-strings.frsh` |

Notes:

1. The fixture files are deliberately compact and repository-owned so a fresh
   clone can qualify the grammar without a sibling project.
2. `examples/query-smoke.frsh` is the larger query sample; it is separate from
   the parser fixture sweep so query capture checks can name their evidence.
3. Negative fixtures are expected to fail and are checked by
   `npm run test:fixtures:negative`.

### Standalone grammar verification command

Run the standalone fixture directory with:

```sh
npm run parse:fixtures
```

That script parses exactly:

- every `.frsh` file under `test/fixtures/valid/`

Because it prints full syntax trees, any `ERROR` or `MISSING` node stays visible
in command output. `npm run parse:fixtures:check` fails non-zero when either
node kind appears or the fixture root is missing.

## Planned query capture baseline

These captures match the editor-query intent and should remain available in this repository's `queries/`:

- `@keyword`: statement/control/declaration keywords
- `@comment`, `@comment.inclusive`: line, block, hash, shebang comments as appropriate
- `@string`: all string forms
- `@number`, `@boolean`
- `@type`: type annotations, structured type names, namespaces where desired
- `@function`, `@function.method`, `@function.builtin`
- `@variable`, `@variable.parameter`, `@property`
- `@operator`
- `@punctuation.bracket`, `@punctuation.delimiter`
- `@item`, `@name` for outline queries

## Pest rule → Tree-sitter mapping

### 1. Lexical + file framing

| Pest rule | Planned Tree-sitter node / treatment | Fields / aliases / captures | Status | Notes |
| --- | --- | --- | --- | --- |
| `WHITESPACE` | `extras` only | none | implemented | Draft uses `/\s/`; final grammar should keep newline in extras except where line-sensitive constructs need scanner help. |
| `COMMENT` | no node; expands to concrete comment rules | none | implemented | Pest aggregate rule becomes Tree-sitter lexer coverage only. |
| `line_comment` | `line_comment` | `@comment` | implemented | Present in draft and queries. |
| `block_comment` | `block_comment` | `@comment` | implemented | Present in draft and queries. |
| `hash_comment` | `hash_comment` | `@comment` | implemented | Included in `extras`; token requires a non-`!` character after `#` so it cannot consume shebang. |
| `program` | `program` | top-level repeat of statement-like nodes | implemented | Standalone grammar now reserves the first top-level slot for an optional `source_shebang_statement`. |
| `source_shebang_statement` | `source_shebang_statement` | `@comment` or dedicated `@preproc`-style capture if needed | implemented | Parsed as a real statement node via `program := optional(source_shebang_statement) ...`, keeping `#!` out of `hash_comment`. |

### 2. Statement dispatcher + imports

| Pest rule | Planned Tree-sitter node / treatment | Fields / aliases / captures | Status | Notes |
| --- | --- | --- | --- | --- |
| `statement` | `_statement` | internal supertype | implemented | Standalone grammar covers the pest statement surface, including `method_call_statement`, both `default_import_statement` and preserved legacy `import_statement`, and a scanner-free `shell_case_statement` token island as real statement nodes. |
| `default_import_statement` | `default_import_statement` | `binding:` identifier, `source:` quoted import path | implemented | Wrapper/default imports preserve the binding and `from` source as explicit fields; query captures mark `from` as control syntax, the source as `@string.special`, and the binding as a variable/local definition. |
| `import_statement` | `import_statement` | `source:` child `import_path`, optional `trailing:` raw-text child | implemented | Preserved legacy compatibility node for imports without a binding; standalone grammar parses imports as statement nodes instead of letting quoted paths collapse into ordinary string expressions. Its `import_path` wrapper is captured as `@string.special`. |
| `import_path` | `import_path` wrapping concrete import-path tokens | `source:` on parent; `@string.special` or `@string` | implemented | Preserves double-quoted, single-quoted, and unquoted path forms as distinct children under the import-only wrapper node, without reusing the ordinary `string_literal` / `single_quoted_string` nodes. |
| `import_path_inner` | no standalone CST node | folded into string token text | deferred | Pest helper only. |
| `unquoted_import_path` | `unquoted_import_path` | child under `import_path` | implemented | Covers non-quoted import paths without reusing the generic `identifier` token. |
| `import_trailing` | `import_trailing` | optional `trailing:` child on `import_statement` | implemented | Matches pest/import-resolver behavior by capturing any remaining non-newline text after the path, including bare semicolons and ignored trailing junk. |

### 3. Declarations + types

| Pest rule | Planned Tree-sitter node / treatment | Fields / aliases / captures | Status | Notes |
| --- | --- | --- | --- | --- |
| `variable_declaration` | `variable_declaration` | `kind`, `name`, `type`, `value` | implemented | Matches draft fields. |
| `kw_decl` | anonymous token (`let`/`const`) | `kind:` field on parent | implemented | No standalone node needed. |
| `structured_type_declaration` | `structured_type_declaration` | `kind`, `name` | implemented | Matches draft. |
| `structured_type_keyword` | anonymous token (`interface`/`record`) | `kind:` field on parent | implemented | No standalone node needed. |
| `structured_type_field` | `structured_type_field` | `name`, `type` | implemented | Standalone grammar parses semicolon-terminated fields inside a named `structured_type_body` node. |
| `function_declaration` | `function_declaration` | `name`, `parameters`, `return_type`, `body` | implemented | Standalone grammar keeps the block under a `body` field and the optional parameter list under `parameters`. |
| `parameter_list` | `parameter_list` | repeated `parameter` children | implemented | Optional trailing comma is accepted for Tree-sitter ergonomics. |
| `parameter` | `parameter` | `name`, `type` | implemented | Type annotation remains optional, matching pest. |
| `type_annotation` | `type_annotation` | base `name` plus repeated suffix children | implemented | Standalone grammar exposes suffix chaining explicitly instead of using a hidden `type_term` helper. |
| `type_term` | `identifier` child | `@type` via parent context | deferred | Helper rule only; represented by the `name` field on `type_annotation`. |
| `array_type_suffix` | `array_type_suffix` | none | implemented | Covers `[]` suffix repetition directly on `type_annotation`. |
| `generic_type_suffix` | `generic_type_suffix` | child `type_annotation_list` | implemented | Covers `<...>` suffix repetition directly on `type_annotation`. |
| `type_annotation_list` | `type_annotation_list` | repeated `type_annotation` children | implemented | Used inside `generic_type_suffix`. |

### 4. Control flow + block structure

| Pest rule | Planned Tree-sitter node / treatment | Fields / aliases / captures | Status | Notes |
| --- | --- | --- | --- | --- |
| `if_statement` | `if_statement` | `condition`, `body`, `else_if_clause*`, `else_clause?` | implemented | Standalone grammar keeps the body/catch arms as explicit `block` nodes and uses AST-aligned `body` naming across the if/else family. |
| `else_if_clause` | `else_if_clause` | `condition`, `body` | implemented | Uses the same AST-aligned `body` field as `Statement::If.else_ifs`. |
| `else_clause` | `else_clause` | `body` | implemented | Uses AST-aligned `body` naming for the trailing else block. |
| `while_statement` | `while_statement` | `condition` | implemented | Matches draft. |
| `for_statement` | `for_statement` | init decl, `condition`, `update` | implemented | Mirrors pest's semicolon layout: the initializer is a full `variable_declaration` that already consumes the first `;`, followed by the condition, separator `;`, and update clause. |
| `for_update` | `for_update` | identifier/update expression | implemented | Draft supports increment/decrement and assignment. |
| `for_in_statement` | `for_in_statement` | `kind`, `name`, `type`, `iterable` | implemented | Matches draft. |
| `switch_statement` | `switch_statement` | `value`, cases, default | implemented | Matches draft. |
| `case_clause` | `case_clause` | case values + repeated body statements | implemented | Matches draft. |
| `case_value_list` | `case_value_list` | repeated expressions | implemented | Matches draft. |
| `default_clause` | `default_clause` | repeated body statements | implemented | Matches draft. |
| `return_statement` | `return_statement` | optional `value` expression child | implemented | Semicolon-terminated, matching pest. |
| `exit_statement` | `exit_statement` | `value` expression child | implemented | Accepts both `exit value;` and pest's parenthesized `exit(value);` form while exposing the inner expression directly as the `value` child instead of a wrapper helper node. |
| `break_statement` | `break_statement` | none | implemented | Semicolon-terminated, matching pest. |
| `continue_statement` | `continue_statement` | none | implemented | Semicolon-terminated, matching pest. |
| `parallel_statement` | `parallel_statement` | `value` expression child | implemented | Semicolon-terminated, matching pest. |
| `try_catch_statement` | `try_catch_statement` | `try_body`, optional `error_message`, `catch_body` | implemented | Uses explicit block children for both arms with field names aligned to `Statement::TryCatch`. |
| `defer_statement` | `defer_statement` | `value` expression child | implemented | Semicolon-terminated, matching pest. |
| `block` | `block` | repeated `_statement` children | implemented | Nested bodies only accept real statements, with `block` itself admitted as a statement so naked nested `{ ... }` bodies still parse where pest allows repeated statements. |
| `method_call_statement` | `method_call_statement` | `call:` `builtin_method_call` | implemented | Standalone grammar keeps this newline-terminated statement wrapper around `builtin_method_call`. |
| `shell_case_statement` | `shell_case_statement` | raw body text; likely `@string.special`/none | implemented | Standalone grammar keeps a scanner-free token island for the currently covered top-level `case ... esac` fixtures, but it still terminates on the first literal `esac` substring rather than a shell-aware closing keyword. |

### 5. Operators + precedence ladder

| Pest rule | Planned Tree-sitter node / treatment | Fields / aliases / captures | Status | Notes |
| --- | --- | --- | --- | --- |
| `op_assign` | anonymous `=` token | `@operator` | implemented | Queried by literal token. |
| `op_ternary_q` | anonymous `?` token | `@operator` | implemented | Queried by literal token. |
| `op_ternary_c` | anonymous `:` token | `@operator` | implemented | Queried by literal token. |
| `op_or` | anonymous `||` token | `@operator` | implemented | Queried by literal token. |
| `op_and` | anonymous `&&` token | `@operator` | implemented | Queried by literal token. |
| `op_eq` | anonymous `==`/`===` token | `@operator` | implemented | Queried by literal token. |
| `op_ne` | anonymous `!=`/`!==` token | `@operator` | implemented | Queried by literal token. |
| `op_lt` | anonymous `<` token | `@operator` | implemented | Queried by literal token. |
| `op_le` | anonymous `<=` token | `@operator` | implemented | Queried by literal token. |
| `op_gt` | anonymous `>` token | `@operator` | implemented | Queried by literal token. |
| `op_ge` | anonymous `>=` token | `@operator` | implemented | Queried by literal token. |
| `op_add` | anonymous `+` token | `@operator` | implemented | Queried by literal token. |
| `op_sub` | anonymous `-` token | `@operator` | implemented | Queried by literal token. |
| `op_mul` | anonymous `*` token | `@operator` | implemented | Queried by literal token. |
| `op_div` | anonymous `/` token | `@operator` | implemented | Queried by literal token. |
| `op_mod` | anonymous `%` token | `@operator` | implemented | Queried by literal token. |
| `op_not` | anonymous `!` token | `@operator` | implemented | Queried by literal token. |
| `op_inc` | anonymous `++` token | `@operator` | implemented | Queried by literal token. |
| `op_dec` | anonymous `--` token | `@operator` | implemented | Queried by literal token. |
| `expression` | `_expression` supertype | none | implemented | `_expression` is now a hidden dispatcher that chooses either a real `assignment_expression` node or the hidden ternary/logical ladder, preventing wrapper nodes around plain literals/calls. |
| `assignment_expression` | `assignment_expression` | `left`, `operator`, `right` | implemented | Uses `prec.right(...)` so chained assignments stay right-associative, only accept lvalue-like left sides, and can take any lower-precedence expression on the right. |
| `ternary` | `ternary` | `condition`, `operator`, `true_expr`, `false_expr` | implemented | Uses `prec.right(...)`; both branches accept full `_expression`, so nested ternaries stay right-associative while assignment-bearing branches still parse without extra wrapper nodes. |
| `logical_or` | `logical_or` | `left`, `operator`, `right` | implemented | Left-associative `||` chains sit above logical-and and below ternary. |
| `logical_and` | `logical_and` | `left`, `operator`, `right` | implemented | Left-associative `&&` chains sit above equality and below logical-or. |
| `equality` | `equality` | `left`, `operator`, `right` | implemented | Supports both loose/strict equality and inequality (`==`, `===`, `!=`, `!==`). |
| `relational` | `relational` | `left`, `operator`, `right` | implemented | Left-associative `<`, `<=`, `>`, `>=` comparisons sit above additive expressions. |
| `additive` | `additive` | `left`, `operator`, `right` | implemented | Left-associative `+`/`-` sit above multiplicative expressions. |
| `multiplicative` | `multiplicative` | `left`, `operator`, `right` | implemented | Left-associative `*`, `/`, `%` bind tighter than additive and looser than unary. |
| `unary` | `unary_expression` plus prefix/postfix update nodes | `operator`, `argument` | implemented | Generic unary `!` and unary `-` recurse over the full unary layer, while `prefix_update_expression` remains a narrower lvalue-only form for `++`/`--`. |
| `postfix` | `_postfix_expression` + split named nodes | internal layer for calls/access; update expressions consume `_update_target_expression` | implemented | Fixes the Zed draft reachability bug by making calls/member/subscript forms first-class expression inputs while still keeping assignment/update targets lvalue-like. |
| `array_access` | `array_access` | `array`, `index` | implemented | Parses reachable postfix subscripts like `arr[i]`. |
| `property_access` | `property_access` | `object`, `property` | implemented | Parses reachable postfix member access like `obj.prop`. |

### 6. Primary expressions + literals

| Pest rule | Planned Tree-sitter node / treatment | Fields / aliases / captures | Status | Notes |
| --- | --- | --- | --- | --- |
| `primary` | inline `choice(...)` under `_expression` | none | implemented | Standalone grammar intentionally avoids a public `primary` wrapper node for flatter trees. |
| `object_literal` | `object_literal` | repeated `object_entry` | implemented | Present in standalone grammar; keeps entries explicit for queries. |
| `object_entry` | `object_entry` | `key`, `value` | implemented | Keys remain identifiers for now, matching pest. |
| `lambda_expression` | `lambda_expression` | `parameters`, `body` | implemented | Standalone grammar now parses the fixture lambda shape `(<identifier-list>) => { ... }` and keeps the body as a real `block` node, matching `Expression::Lambda`. |
| `lambda_parameter_list` | `lambda_parameter_list` | repeated `parameter` identifiers | implemented | Uses repeated identifier children under a dedicated list node to mirror `LambdaExpression.params`. |
| `parenthesized` | `parenthesized_expression` | `expression` | implemented | Renamed for clearer CST queries and to avoid a generic noun-only node. |
| `console_log_call` | `console_log_call` | `object: identifier("console")`, `method: identifier("log")`, `args`; `@function.builtin` | implemented | Kept distinct so queries can capture `console` and `log` directly while staying aligned with the AST's method-call shape. |
| `builtin_method_call` | `builtin_method_call` | `object`, `method`, `args` | implemented | Covers namespace/object-style calls like `git.status()` while preserving AST-aligned field names for downstream consumers. |
| `function_call` | `function_call` | `name`, `args` | implemented | Standalone grammar currently accepts direct calls on identifiers and parenthesized expressions; field names now align with `Expression::Call`. |
| `argument_list` | `argument_list` | repeated `argument` expressions | implemented | Optional trailing comma is accepted for Tree-sitter ergonomics. |
| `string_interpolation` | `string_interpolation` | `@string`; future interpolation subcaptures optional | implemented | Standalone grammar now tokenizes backtick strings conservatively, including `${...}` text as part of the string token without parsing interpolation internals yet. |
| `string_literal` | `string_literal` | `@string` | implemented | Matches draft. |
| `string_escaped` | anonymous token content | capture escapes inside string queries | deferred | Helper rule only. |
| `string_char` | anonymous token content | none | deferred | Helper rule only. |
| `single_quoted_string` | `single_quoted_string` | `@string` | implemented | Matches draft grammar; VS Code TextMate grammar forgets to include the `single-strings` repository entry. |
| `multiline_string` | `multiline_string` | `@string` | implemented | Standalone grammar uses triple double quotes (`""" ... """`) for multiline string tokens. |
| `multiline_body` | anonymous token content | none | deferred | Helper rule only. |
| `number_literal` | `number_literal` | `@number` | implemented | Standalone grammar accepts the pest-style optional leading `-`. |
| `boolean_literal` | `boolean_literal` | `@boolean` | implemented | Direct `true`/`false` literal node. |
| `array_literal` | `array_literal` | repeated expression children | implemented | Standalone grammar allows multiline layout via `extras` and keeps element nodes flat. |
| `expression_statement` | `expression_statement` | `expression` | implemented | Simple semicolon-terminated wrapper for standalone statement coverage. |
| `identifier` | `identifier` | `@variable` fallback, contextual captures elsewhere | implemented | Matches draft. |

## AST variant mapping

### Statements

| Rust AST variant | Planned Tree-sitter node | Notes |
| --- | --- | --- |
| `Statement::VariableDeclaration` | `variable_declaration` | `kind`, `name`, `type`, `value` fields line up directly. |
| `Statement::ExpressionStatement` | `expression_statement` | Direct map. |
| `Statement::If` | `if_statement` + `else_if_clause` + `else_clause` | `condition`, `body`, `else_ifs`, and `else_body` stay readable through explicit clause nodes with `body` fields. |
| `Statement::While` | `while_statement` | Direct map. |
| `Statement::For` | `for_statement` | Update clause stays syntactic, not lowered. |
| `Statement::ForIn` | `for_in_statement` | Direct map. |
| `Statement::FunctionDeclaration` | `function_declaration` | Direct map. |
| `Statement::StructuredTypeDeclaration` | `structured_type_declaration` | `is_record` comes from the `kind` token. |
| `Statement::Return` | `return_statement` | Direct map. |
| `Statement::Break` | `break_statement` | Direct map. |
| `Statement::Continue` | `continue_statement` | Direct map. |
| `Statement::Exit` | `exit_statement` | Direct map. |
| `Statement::Defer` | `defer_statement` | AST stores a statement-like wrapper; pest currently parses an expression. |
| `Statement::Switch` | `switch_statement` | Case/default children preserved. |
| `Statement::TryCatch` | `try_catch_statement` | `try_body`, `catch_body`, and optional `error_message` fields align directly with the AST variant. |
| `Statement::Parallel` | `parallel_statement` | Direct map. |
| `Statement::Import` | `import_statement` | Missing from draft grammar. |
| `Statement::SourceShebang` | `source_shebang_statement` | Missing from draft grammar. |
| `Statement::ShellCase` | `shell_case_statement` | Missing from draft grammar. |

### Expressions

| Rust AST variant | Planned Tree-sitter node | Notes |
| --- | --- | --- |
| `Expression::StringLiteral` | `string_literal` | Direct map. |
| `Expression::SingleQuotedString` | `single_quoted_string` | Direct map. |
| `Expression::NumberLiteral` | `number_literal` | Direct map. |
| `Expression::BooleanLiteral` | `boolean_literal` | Direct map. |
| `Expression::Identifier` | `identifier` | Direct map. |
| `Expression::Parenthesized` | `parenthesized_expression` | Direct map. |
| `Expression::BinaryOp` | `assignment_expression` / `logical_or` / `logical_and` / `equality` / `relational` / `additive` / `multiplicative` | Tree-sitter keeps precedence nodes with explicit operator fields; AST later lowers by operator token. |
| `Expression::UnaryOp` | `unary_expression` / `prefix_update_expression` | Generic unary `!`/`-` use `unary_expression`; `++`/`--` stay in their dedicated update-expression nodes. |
| `Expression::Call` | `function_call` | Uses AST-aligned `name` and `args` fields. |
| `Expression::MethodCall` | `builtin_method_call` or `console_log_call` | Both call nodes use AST-aligned `object`/`method`/`args` fields; `console_log_call` should lower here, not to a separate AST variant. |
| `Expression::ArrayLiteral` | `array_literal` | Direct map. |
| `Expression::ArrayAccess` | `array_access` | Needs reachable postfix path. |
| `Expression::ObjectPropertyAccess` | `property_access` | Needs reachable postfix path. |
| `Expression::Ternary` | `ternary` | Uses AST-aligned `condition`, `true_expr`, and `false_expr` fields. |
| `Expression::Lambda` | `lambda_expression` | Direct map. |
| `Expression::InterpolatedString` | `string_interpolation` | Repo discrepancy: AST models parsed parts, but pest/draft grammar currently tokenize raw text. |
| `Expression::MultilineString` | `multiline_string` | `preserves_indentation` is semantic, not syntactic. |
| `Expression::ObjectLiteral` | `object_literal` | Direct map. |
| `Expression::PostIncrement` | `postfix_update_expression` | Dedicated named node with `argument` field. |
| `Expression::PostDecrement` | `postfix_update_expression` | Dedicated named node with `argument` field. |
| `Expression::PreIncrement` | `prefix_update_expression` | Dedicated named node with `argument` field. |
| `Expression::PreDecrement` | `prefix_update_expression` | Dedicated named node with `argument` field. |

## Known gaps from the existing Zed draft grammar

1. The standalone grammar now includes `shell_case_statement` as a scanner-free opaque token island, but it still inherits the pest rule's coarse `first literal esac wins` behavior rather than understanding shell quoting or nesting.
   - Passing corpus shape today: top-level shell case blocks whose body does not contain a literal `esac` substring before the real terminator.
   - Known failing shape without a scanner:
     ```ferrish
     case "$1" in
       foo)
         echo "esac appears in a string"
         ;;
     esac
     ```
     The current token would terminate at the `esac` inside the quoted string.
   - Known failing shape without a scanner:
     ```ferrish
     case "$1" in
       esac)
         echo "pattern name matches terminator"
         ;;
     esac
     ```
     The current token would terminate at the `esac` pattern label instead of the closing keyword.
    - Decision: do **not** add an external scanner yet. The current string + shell-case corpus passes without one, the repository has no `src/scanner.c`, and the current Ferrish fixture set only needs opaque top-level shell blocks.
    - Next step if that changes: add an external scanner that recognizes `case` bodies until a standalone `esac` keyword at shell depth 0 while ignoring quoted/comment text.
2. The standalone grammar now includes `import_statement` plus its quoted/unquoted path helpers and trailing-text capture as real CST nodes, while the draft reference still diverges until it is updated separately.
3. The standalone grammar now includes the full assignment/ternary/logical/equality/relational/additive/multiplicative/unary ladder plus `console_log_call`, `builtin_method_call`, `function_call`, `array_access`, `property_access`, and prefix/postfix update expressions through a shared `_postfix_expression` layer, with hidden pass-through rungs so only real operator nodes surface in the CST.
4. The old Zed unary/postfix reachability bug is fixed in the standalone grammar, but the draft reference still diverges until it is updated separately.
5. `lambda_expression` / `lambda_parameter_list` are implemented for the current Ferrish fixture shape `(<identifier-list>) => { ... }`; broader arrow-function forms (for example expression bodies or typed parameters) remain outside the current pest grammar and are still unsupported.
6. String interpolation is still only tokenized as raw backtick text in the standalone grammar, even though the Rust AST already expects structured interpolation parts.
7. `method_call_statement` is implemented as a `call:` wrapper around `builtin_method_call`, so newline-terminated method calls without semicolons remain represented as statements.
8. `program` still accepts a pragmatic `_statement_or_expression` mix so the standalone corpus can cover both bare literals and statement syntax, but `block`, `switch`, and other nested statement bodies are now restricted to real `_statement` forms, with `block` itself admitted as a statement for nested control-flow bodies.
9. VS Code TextMate grammar reality differs from both pest and Zed draft: its `single-strings` repository entry is never included at the top level, so single-quoted strings are likely under-highlighted there.

## Maintenance boundaries

1. Keep `grammar.js` as the source of truth and regenerate tracked parser
   artifacts with the locked CLI.
2. Keep `shell_case_statement` scanner-free until real inputs require ignoring
   `esac` inside shell strings, comments, or pattern labels.
3. Keep `console_log_call` explicit so namespace and method captures remain
   stable.
4. Keep string nodes distinct, but defer structural `${...}` interpolation
   parsing until parser and consumer requirements are clearer.
