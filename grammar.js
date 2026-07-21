const PREC = {
  assignment: 1,
  ternary: 2,
  logical_or: 3,
  logical_and: 4,
  equality: 5,
  relational: 6,
  additive: 7,
  multiplicative: 8,
  prefix: 9,
  postfix: 10,
  member: 11,
  call: 12,
};

module.exports = grammar({
  name: 'ferrish',

  extras: ($) => [/\s+/, $.line_comment, $.block_comment, $.hash_comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
     [$._primary_expression, $._update_target_expression],
      [$._postfix_expression, $._update_target_expression],
      [$._postfix_expression, $.method_call_statement],
      [$.block, $.object_literal],
      [$._primary_expression, $.lambda_parameter_list]
  ],

  rules: {
    program: ($) => seq(
      optional($.source_shebang_statement),
      repeat($._statement_or_expression)
    ),

    _statement_or_expression: ($) => choice(
      $._statement,
      $._expression
    ),

    _statement: ($) => choice(
      $.block,
      $.default_import_statement,
      $.import_statement,
      $.variable_declaration,
      $.structured_type_declaration,
      $.function_declaration,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.for_in_statement,
      $.switch_statement,
      $.try_catch_statement,
      $.return_statement,
      $.exit_statement,
      $.break_statement,
      $.continue_statement,
      $.parallel_statement,
      $.defer_statement,
      $.shell_case_statement,
      $.method_call_statement,
      $.expression_statement
    ),

    _expression: ($) => choice(
      $.assignment_expression,
      $._ternary_expression
    ),

    assignment_expression: ($) => prec.right(PREC.assignment, seq(
      field('left', $._update_target_expression),
      field('operator', '='),
      field('right', $._expression)
    )),

    _ternary_expression: ($) => choice($.ternary, $._logical_or_expression),

    ternary: ($) => prec.right(PREC.ternary, seq(
      field('condition', $._logical_or_expression),
      field('operator', '?'),
      field('true_expr', $._expression),
      ':',
      field('false_expr', $._expression)
    )),

    _logical_or_expression: ($) => choice($.logical_or, $._logical_and_expression),

    logical_or: ($) => prec.left(PREC.logical_or, seq(
      field('left', $._logical_or_expression),
      field('operator', '||'),
      field('right', $._logical_and_expression)
    )),

    _logical_and_expression: ($) => choice($.logical_and, $._equality_expression),

    logical_and: ($) => prec.left(PREC.logical_and, seq(
      field('left', $._logical_and_expression),
      field('operator', '&&'),
      field('right', $._equality_expression)
    )),

    _equality_expression: ($) => choice($.equality, $._relational_expression),

    equality: ($) => prec.left(PREC.equality, seq(
      field('left', $._equality_expression),
      field('operator', choice('==', '===', '!=', '!==')),
      field('right', $._relational_expression)
    )),

    _relational_expression: ($) => choice($.relational, $._additive_expression),

    relational: ($) => prec.left(PREC.relational, seq(
      field('left', $._relational_expression),
      field('operator', choice('<', '<=', '>', '>=')),
      field('right', $._additive_expression)
    )),

    _additive_expression: ($) => choice($.additive, $._multiplicative_expression),

    additive: ($) => prec.left(PREC.additive, seq(
      field('left', $._additive_expression),
      field('operator', choice('+', '-')),
      field('right', $._multiplicative_expression)
    )),

    _multiplicative_expression: ($) => choice($.multiplicative, $._unary_expression),

    multiplicative: ($) => prec.left(PREC.multiplicative, seq(
      field('left', $._multiplicative_expression),
      field('operator', choice('*', '/', '%')),
      field('right', $._unary_expression)
    )),

    _unary_expression: ($) => choice(
      $.unary_expression,
      $.prefix_update_expression,
      $.postfix_update_expression,
      $._postfix_expression
    ),

    unary_expression: ($) => prec.right(PREC.prefix, seq(
      field('operator', choice('!', '-')),
      field('argument', $._unary_expression)
    )),

    _postfix_expression: ($) => choice(
      $._primary_expression,
      $.function_call,
      $.console_log_call,
      $.builtin_method_call,
      $.array_access,
      $.property_access
    ),

    _update_target_expression: ($) => choice(
      $.identifier,
      $.array_access,
      $.property_access
    ),

    _primary_expression: ($) => choice(
      $.lambda_expression,
      $.parenthesized_expression,
      $.array_literal,
      $.object_literal,
      $.boolean_literal,
      $.identifier,
      $.number_literal,
      $.string_literal,
      $.single_quoted_string,
      $.string_interpolation,
      $.multiline_string
    ),

    identifier: () => /[A-Za-z_][A-Za-z0-9_]*/,

    source_shebang_statement: () => token(seq('#!', /[^\n]*/)),

    default_import_statement: ($) => prec(2, seq(
      'import',
      field('binding', $.identifier),
      'from',
      field('source', choice(
        $.double_quoted_import_path,
        $.single_quoted_import_path
      )),
      optional(';')
    )),

    import_statement: ($) => seq(
      'import',
      field('source', $.import_path),
      optional(field('trailing', $.import_trailing))
    ),

    import_path: ($) => choice(
      $.double_quoted_import_path,
      $.single_quoted_import_path,
      $.unquoted_import_path
    ),

    double_quoted_import_path: () => token(seq(
      '"',
      repeat(choice(/[^"\\\n]+/, /\\./)),
      '"'
    )),

    single_quoted_import_path: () => token(seq(
      "'",
      repeat(choice(/[^'\\\n]+/, /\\./)),
      "'"
    )),

    unquoted_import_path: () => token(/[^\s'";]+/),

    import_trailing: () => token(/[^\n]+/),

    variable_declaration: ($) => seq(
      field('kind', choice('let', 'const')),
      field('name', $.identifier),
      optional(seq(':', field('type', $.type_annotation))),
      '=',
      field('value', $._expression),
      ';'
    ),

    structured_type_declaration: ($) => seq(
      field('kind', choice('interface', 'record')),
      field('name', $.identifier),
      field('body', $.structured_type_body)
    ),

    structured_type_body: ($) => seq(
      '{',
      repeat($.structured_type_field),
      '}'
    ),

    structured_type_field: ($) => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type_annotation),
      ';'
    ),

    function_declaration: ($) => seq(
      'function',
      field('name', $.identifier),
      '(',
      optional(field('parameters', $.parameter_list)),
      ')',
      optional(seq(':', field('return_type', $.type_annotation))),
      field('body', $.block)
    ),

    parameter_list: ($) => seq(
      $.parameter,
      repeat(seq(',', $.parameter)),
      optional(',')
    ),

    parameter: ($) => seq(
      field('name', $.identifier),
      optional(seq(':', field('type', $.type_annotation)))
    ),

    type_annotation: ($) => seq(
      field('name', $.identifier),
      repeat(choice(
        $.array_type_suffix,
        $.generic_type_suffix
      ))
    ),

    array_type_suffix: () => '[]',

    generic_type_suffix: ($) => seq(
      '<',
      $.type_annotation_list,
      '>'
    ),

    type_annotation_list: ($) => seq(
      $.type_annotation,
      repeat(seq(',', $.type_annotation))
    ),

    block: ($) => seq(
      '{',
      repeat($._statement),
      '}'
    ),

    if_statement: ($) => seq(
      'if',
      '(',
      field('condition', $._expression),
      ')',
      field('body', $.block),
      repeat($.else_if_clause),
      optional($.else_clause)
    ),

    else_if_clause: ($) => seq(
      'else',
      'if',
      '(',
      field('condition', $._expression),
      ')',
      field('body', $.block)
    ),

    else_clause: ($) => seq(
      'else',
      field('body', $.block)
    ),

    while_statement: ($) => seq(
      'while',
      '(',
      field('condition', $._expression),
      ')',
      field('body', $.block)
    ),

    for_statement: ($) => seq(
      'for',
      '(',
      field('initializer', $.variable_declaration),
      field('condition', $._expression),
      ';',
      field('update', $.for_update),
      ')',
      field('body', $.block)
    ),

    for_update: ($) => choice(
      $.prefix_update_expression,
      $.postfix_update_expression,
      $.assignment_expression
    ),

    for_in_statement: ($) => seq(
      'for',
      '(',
      field('kind', choice('let', 'const')),
      field('name', $.identifier),
      optional(seq(':', field('type', $.type_annotation))),
      'in',
      field('iterable', $._expression),
      ')',
      field('body', $.block)
    ),

    switch_statement: ($) => seq(
      'switch',
      '(',
      field('value', $._expression),
      ')',
      '{',
      repeat($.case_clause),
      optional($.default_clause),
      '}'
    ),

    case_clause: ($) => seq(
      'case',
      field('values', $.case_value_list),
      ':',
      repeat($._statement)
    ),

    case_value_list: ($) => seq(
      $._expression,
      repeat(seq(',', $._expression))
    ),

    default_clause: ($) => seq(
      'default',
      ':',
      repeat($._statement)
    ),

    return_statement: ($) => seq(
      'return',
      optional(field('value', $._expression)),
      ';'
    ),

    exit_statement: ($) => seq(
      'exit',
      choice(
        seq('(', field('value', $._expression), ')'),
        field('value', $._exit_value_expression)
      ),
      ';'
    ),

    _exit_value_expression: ($) => choice(
      $.assignment_expression,
      $.ternary,
      $.logical_or,
      $.logical_and,
      $.equality,
      $.relational,
      $.additive,
      $.multiplicative,
      $.unary_expression,
      $.prefix_update_expression,
      $.postfix_update_expression,
      $.function_call,
      $.console_log_call,
      $.builtin_method_call,
      $.array_access,
      $.property_access,
      $.array_literal,
      $.object_literal,
      $.lambda_expression,
      $.boolean_literal,
      $.identifier,
      $.number_literal,
      $.string_literal,
      $.single_quoted_string,
      $.string_interpolation,
      $.multiline_string
    ),

    break_statement: () => seq('break', ';'),

    continue_statement: () => seq('continue', ';'),

    parallel_statement: ($) => seq(
      'parallel',
      field('value', $._expression),
      ';'
    ),

    try_catch_statement: ($) => seq(
      'try',
      field('try_body', $.block),
      'catch',
      optional(seq('(', field('error_message', $.string_literal), ')')),
      field('catch_body', $.block)
    ),

    defer_statement: ($) => seq(
      'defer',
      field('value', $._expression),
      ';'
    ),

    // Best-effort opaque shell island. Keep this scanner-free while the corpus
    // only needs top-level `case ... esac` blocks that do not contain an early
    // literal `esac`. Promote this to an external scanner only if real fixtures
    // prove we must ignore quoted/comment text or pattern labels while searching
    // for the closing `esac` keyword.
    shell_case_statement: () => token(seq(
      'case',
      repeat(choice(
        /[^e]+/,
        /e[^s]/,
        /es[^a]/,
        /esa[^c]/
      )),
      'esac',
      optional(/\r?\n/)
    )),

    expression_statement: ($) => seq(
      field('expression', $._expression),
      ';'
    ),

    method_call_statement: ($) => field('call', $.builtin_method_call),

    prefix_update_expression: ($) => prec.right(PREC.prefix, seq(
      field('operator', choice('++', '--')),
      field('argument', $._update_target_expression)
    )),

    postfix_update_expression: ($) => prec.left(PREC.postfix, seq(
      field('argument', $._update_target_expression),
      field('operator', choice('++', '--'))
    )),

    parenthesized_expression: ($) => seq(
      '(',
      field('expression', $._expression),
      ')'
    ),

    lambda_expression: ($) => seq(
      '(',
      optional(field('parameters', $.lambda_parameter_list)),
      ')',
      '=>',
      field('body', $.block)
    ),

    lambda_parameter_list: ($) => seq(
      field('parameter', $.identifier),
      repeat(seq(',', field('parameter', $.identifier)))
    ),

    function_call: ($) => prec.left(PREC.call, seq(
      field('name', choice($.identifier, $.parenthesized_expression)),
      field('args', $.argument_list)
    )),

    console_log_call: ($) => prec.left(PREC.call, seq(
      field('object', alias('console', $.identifier)),
      '.',
      field('method', alias('log', $.identifier)),
      field('args', $.argument_list)
    )),

    builtin_method_call: ($) => prec.left(PREC.call, seq(
      field('object', $._postfix_expression),
      '.',
      field('method', $.identifier),
      field('args', $.argument_list)
    )),

    argument_list: ($) => seq(
      '(',
      optional(seq(
        field('argument', $._expression),
        repeat(seq(',', field('argument', $._expression))),
        optional(',')
      )),
      ')'
    ),

    array_access: ($) => prec.left(PREC.member, seq(
      field('array', $._postfix_expression),
      '[',
      field('index', $._expression),
      ']'
    )),

    property_access: ($) => prec.left(PREC.member, seq(
      field('object', $._postfix_expression),
      '.',
      field('property', $.identifier)
    )),

    array_literal: ($) => seq(
      '[',
      optional(seq(
        field('element', $._expression),
        repeat(seq(',', field('element', $._expression))),
        optional(',')
      )),
      ']'
    ),

    object_literal: ($) => seq(
      '{',
      optional(seq(
        $.object_entry,
        repeat(seq(',', $.object_entry)),
        optional(',')
      )),
      '}'
    ),

    object_entry: ($) => seq(
      field('key', $.identifier),
      ':',
      field('value', $._expression)
    ),

    boolean_literal: () => choice('true', 'false'),

    number_literal: () => /-?\d+(?:\.\d+)?/,

    string_literal: () => token(seq(
      '"',
      repeat(choice(/[^"\\\n]+/, /\\./)),
      '"'
    )),

    single_quoted_string: () => token(seq(
      "'",
      repeat(choice(/[^'\\\n]+/, /\\./)),
      "'"
    )),

    string_interpolation: () => token(seq(
      '`',
      repeat(choice(/[^`\\]+/, /\\./)),
      '`'
    )),

    multiline_string: () => token(seq(
      '"""',
      repeat(choice(/[^\"]+/, /"[^\"]/, /""[^\"]/)),
      '"""'
    )),

    line_comment: () => token(seq('//', /[^\n]*/)),

    block_comment: () => token(seq(
      '/*',
      repeat(choice(/[^*]+/, /\*[^/]/, '/')),
      '*/'
    )),

    hash_comment: () => token(seq('#', /[^!\n][^\n]*/))
  }
});
