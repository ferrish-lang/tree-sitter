[
  (block)
  (structured_type_body)
  (case_clause)
  (default_clause)
] @local.scope

(function_declaration
  name: (identifier) @local.definition.function)

(structured_type_declaration
  name: (identifier) @local.definition.type)

(structured_type_field
  name: (identifier) @local.definition.field)

(parameter
  name: (identifier) @local.definition.parameter)

(variable_declaration
  name: (identifier) @local.definition.variable)

(for_in_statement
  name: (identifier) @local.definition.variable)

(argument_list
  (identifier) @local.reference)

(assignment_expression
  left: (identifier) @local.reference)

(unary_expression
  argument: (identifier) @local.reference)

(postfix_update_expression
  argument: (identifier) @local.reference)

(prefix_update_expression
  argument: (identifier) @local.reference)

(logical_or
  left: (identifier) @local.reference)

(logical_or
  right: (identifier) @local.reference)

(logical_and
  left: (identifier) @local.reference)

(logical_and
  right: (identifier) @local.reference)

(relational
  left: (identifier) @local.reference)

(relational
  right: (identifier) @local.reference)

(equality
  left: (identifier) @local.reference)

(equality
  right: (identifier) @local.reference)

(additive
  left: (identifier) @local.reference)

(additive
  right: (identifier) @local.reference)

(multiplicative
  left: (identifier) @local.reference)

(multiplicative
  right: (identifier) @local.reference)

(ternary
  condition: (identifier) @local.reference)

(ternary
  true_expr: (identifier) @local.reference)

(ternary
  false_expr: (identifier) @local.reference)

(while_statement
  condition: (identifier) @local.reference)

(for_in_statement
  iterable: (identifier) @local.reference)

(switch_statement
  value: (identifier) @local.reference)

(object_entry
  value: (identifier) @local.reference)

(property_access
  object: (identifier) @local.reference)

(array_access
  array: (identifier) @local.reference)
