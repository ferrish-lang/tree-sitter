[(source_shebang_statement) (line_comment) (block_comment) (hash_comment)] @comment

[(string_literal) (single_quoted_string) (multiline_string) (string_interpolation)] @string

(boolean_literal) @boolean
(number_literal) @number

[
  "if"
  "else"
  "for"
  "in"
  "while"
  "switch"
  "case"
  "default"
  "break"
  "continue"
  "return"
  "try"
  "catch"
  "defer"
  "import"
  "parallel"
  "exit"
] @keyword.control

[
  "let"
  "const"
  "function"
  "record"
  "interface"
] @keyword.declaration

[
  "="
  "?"
  ":"
  "||"
  "&&"
  "=="
  "==="
  "!="
  "!=="
  "<"
  "<="
  ">"
  ">="
  "+"
  "-"
  "*"
  "/"
  "%"
  "!"
  "++"
  "--"
] @operator

[
  ","
  ";"
  "."
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

(structured_type_declaration
  name: (identifier) @type)

(type_annotation
  name: (identifier) @type)

(function_declaration
  name: (identifier) @function)

(function_call
  name: (identifier) @function.call)

(console_log_call
  object: (identifier) @namespace
  method: (identifier) @function.method.call)

(builtin_method_call
  object: (identifier) @namespace
  method: (identifier) @function.method.call)

(property_access
  property: (identifier) @property)

(object_entry
  key: (identifier) @property)

(structured_type_field
  name: (identifier) @property)

(parameter
  name: (identifier) @variable.parameter)

(variable_declaration
  name: (identifier) @variable)

(for_in_statement
  name: (identifier) @variable)

(argument_list
  (identifier) @variable)

(assignment_expression
  left: (identifier) @variable)

(unary_expression
  argument: (identifier) @variable)

(postfix_update_expression
  argument: (identifier) @variable)

(prefix_update_expression
  argument: (identifier) @variable)

(logical_or
  left: (identifier) @variable)

(logical_or
  right: (identifier) @variable)

(logical_and
  left: (identifier) @variable)

(logical_and
  right: (identifier) @variable)

(relational
  left: (identifier) @variable)

(relational
  right: (identifier) @variable)

(equality
  left: (identifier) @variable)

(equality
  right: (identifier) @variable)

(additive
  left: (identifier) @variable)

(additive
  right: (identifier) @variable)

(multiplicative
  left: (identifier) @variable)

(multiplicative
  right: (identifier) @variable)

(ternary
  condition: (identifier) @variable)

(ternary
  true_expr: (identifier) @variable)

(ternary
  false_expr: (identifier) @variable)

(while_statement
  condition: (identifier) @variable)

(for_in_statement
  iterable: (identifier) @variable)

(switch_statement
  value: (identifier) @variable)

(object_entry
  value: (identifier) @variable)

(property_access
  object: (identifier) @variable)

(array_access
  array: (identifier) @variable)
