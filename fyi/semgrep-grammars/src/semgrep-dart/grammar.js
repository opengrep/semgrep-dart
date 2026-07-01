/*
  semgrep-dart

  Extends the standard dart grammar with semgrep pattern constructs.
*/

const base_grammar = require('tree-sitter-dart/grammar');

module.exports = grammar(base_grammar, {
  name: 'dart',

  conflicts: ($, previous) => previous.concat([
    [$._expression, $.formal_parameter],
    [$.spread_element, $.semgrep_ellipsis],
      [$._expression, $.expression_statement],
      [$._var_or_type, $._function_formal_parameter, $.typed_metavariable],
      [$._real_expression, $._primary],
      [$.argument, $.named_argument]
  ]),

  /*
     Support for semgrep ellipsis ('...') and metavariables ('$FOO'),
     No need for special extensions for metavariables because Dart
     already accepts $ as part of an identifier.
  */
  rules: {
    // entry point
    program: ($, previous) =>
      choice(previous, $.semgrep_expression),

    semgrep_ellipsis: $ => '...',
    semgrep_named_ellipsis: $ => /\$\.\.\.[A-Z_][A-Z_0-9]*/,
    deep_ellipsis: $ => seq(
            '<...', $._expression, '...>'
    ),

    semgrep_dot_ellipsis: $ => seq('.', $.semgrep_ellipsis),
    selector: ($, previous) => choice(
            previous,
            $.semgrep_dot_ellipsis
    ),

    _class_member_definition: ($, previous) => choice(
            previous,
            $.semgrep_ellipsis
    ),

    // Permissive argument list so a semgrep ellipsis (a positional argument)
    // can appear anywhere, including after a named argument, e.g.
    // 'f(..., name: X, ...)'. The base grammar requires positional args before
    // named ones; for patterns/lenient parsing we allow any interleaving.
    _argument_list: $ => seq(
            choice($.argument, $.named_argument),
            repeat(seq(',', choice($.argument, $.named_argument)))
    ),

    // Alternate "entry point". Allows parsing a standalone expression.
    semgrep_expression: ($) => seq("__SEMGREP_EXPRESSION", $._expression),

    typed_metavariable: $ => seq(
        '(',
        field('type', $._type),
        field('metavar', $.identifier),
        ')',
    ),

    assignable_expression: ($, previous) => choice(
      previous,
      $.typed_metavariable
    ),

    _real_expression: ($, previous) => choice(
      previous,
      $.typed_metavariable
    ),

    _primary: ($, previous) => choice(
      previous,
      $.typed_metavariable
    ),

    _expression: ($, previous) => choice(
      previous,
      $.semgrep_ellipsis,
      $.semgrep_named_ellipsis,
      $.deep_ellipsis,
    ),
    expression_statement: ($, previous) => choice(
      previous,
      $.semgrep_ellipsis,
    ),
    formal_parameter: ($, previous) => choice(
       $.semgrep_ellipsis,
       previous
    ),
}
});
// real_expression -> _unary_expression -> unary_expression ->
