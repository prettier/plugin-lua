"use strict";

const {
  concat,
  join,
  line,
  lineSuffix,
  lineSuffixBoundary,
  group,
  conditionalGroup,
  indent,
  dedent,
  ifBreak,
  hardline,
  softline,
  breakParent,
} = require("prettier").doc.builders;
const { willBreak } = require("prettier").doc.utils;
const { makeString, isNextLineEmpty } = require("prettier").util;
const { isValidIdentifier, isExpression, shouldFlatten } = require("./util");
const {
  printDanglingComments,
  isDanglingComment,
  printComments,
} = require("./comments");

function printNoParens(path, options, print) {
  const node = path.getValue();

  switch (node.type) {
    case "Chunk": {
      return printBody(path, options, print);
    }
    case "AssignmentStatement":
    case "LocalStatement": {
      return concat([
        group(
          concat([
            node.type === "LocalStatement" ? "local " : "",
            indent(join(concat([",", line]), path.map(print, "variables"))),
            line,
          ])
        ),
        (() => {
          if (node.init.length === 1) {
            const init0Printed = path.call(print, "init", 0);
            return concat([
              "=",
              group(
                node.init.length === 1 && willBreak(init0Printed)
                  ? concat([" ", init0Printed])
                  : indent(concat([line, init0Printed]))
              ),
            ]);
          } else if (node.init.length > 1) {
            return concat([
              "=",
              group(
                indent(
                  concat([
                    line,
                    join(concat([",", line]), path.map(print, "init")),
                  ])
                )
              ),
            ]);
          } else {
            return "";
          }
        })(),
      ]);
    }
    case "Identifier": {
      return node.name;
    }
    case "FunctionDeclaration": {
      const isEmpty =
        node.body.length === 0 &&
        (!node.comments || node.comments.length === 0);
      const isAnonymous = !node.identifier;
      const hasParams = node.parameters.length > 0;

      return concat([
        node.isLocal ? "local " : "",
        "function",
        isAnonymous ? "" : concat([" ", path.call(print, "identifier")]),
        "(",
        hasParams
          ? group(
              concat([
                softline,
                indent(
                  join(concat([",", line]), path.map(print, "parameters"))
                ),
                softline,
              ])
            )
          : "",
        ")",
        printIndentedBody(path, options, print),
        isAnonymous && isEmpty ? " " : hardline,
        "end",
      ]);
    }
    case "CallStatement": {
      return path.call(print, "expression");
    }
    case "CallExpression": {
      return concat([
        path.call(print, "base"),
        printArgumentsList(path, options, print),
      ]);
    }
    case "StringCallExpression": {
      return concat([path.call(print, "base"), path.call(print, "argument")]);
    }
    case "TableCallExpression": {
      return concat([path.call(print, "base"), path.call(print, "arguments")]);
    }

    case "BooleanLiteral":
    case "NilLiteral":
    case "NumericLiteral":
    case "VarargLiteral": {
      return node.raw;
    }
    case "StringLiteral": {
      if (node.raw[0] === "[") {
        return node.raw;
      } else {
        return printString(node.raw, options);
      }
    }
    case "MemberExpression": {
      return concat([
        path.call(print, "base"),
        node.indexer,
        path.call(print, "identifier"),
      ]);
    }
    case "IndexExpression": {
      return concat([
        path.call(print, "base"),
        "[",
        path.call(print, "index"),
        "]",
      ]);
    }
    case "TableConstructorExpression": {
      if (node.fields.length === 0) {
        return "{}";
      }

      const multiline = concat([
        "{",
        indent(
          concat([
            hardline,
            join(concat([",", hardline]), path.map(print, "fields")),
            options.trailingComma === "none" ? "" : ",",
          ])
        ),
        hardline,
        "}",
      ]);

      const singleline = concat([
        "{",
        options.bracketSpacing ? " " : "",
        join(", ", path.map(print, "fields")),
        options.bracketSpacing ? " " : "",
        "}",
      ]);

      if (
        // Table with only one value with no nested tables
        (node.fields.length === 1 &&
          node.fields[0].value.type !== "TableConstructorExpression") ||
        // Array-like table
        node.fields.every((field) => field.type === "TableValue")
      ) {
        return conditionalGroup([singleline, multiline]);
      } else {
        return multiline;
      }
    }
    case "TableValue": {
      return path.call(print, "value");
    }
    case "TableKeyString": {
      return concat([
        path.call(print, "key"),
        " = ",
        path.call(print, "value"),
      ]);
    }
    case "TableKey": {
      if (
        node.key.type === "StringLiteral" &&
        isValidIdentifier(node.key.value)
      ) {
        // convert to TableKeyString
        return concat([node.key.value, " = ", path.call(print, "value")]);
      } else {
        const isBlockString =
          node.key.type === "StringLiteral" && node.key.raw[0] === "[";
        return concat([
          isBlockString ? "[ " : "[",
          path.call(print, "key"),
          isBlockString ? " ]" : "]",
          " = ",
          path.call(print, "value"),
        ]);
      }
    }
    case "BinaryExpression":
    case "LogicalExpression": {
      const parent = path.getParentNode();
      const isInsideParenthesis = node.inParens;

      const parts = printBinaryishExpressions(
        path,
        print,
        options,
        /* isNested */ false,
        isInsideParenthesis
      );

      //   if (
      //     this.hasPlugin("dynamicImports") && this.lookahead().type === tt.parenLeft
      //   ) {
      //
      // looks super weird, we want to break the children if the parent breaks
      //
      //   if (
      //     this.hasPlugin("dynamicImports") &&
      //     this.lookahead().type === tt.parenLeft
      //   ) {
      // if (isInsideParenthesis) {
      //   return concat(parts);
      // }

      // Break between the parens in unaries or in a member expression, i.e.
      //
      //   (
      //     a &&
      //     b &&
      //     c
      //   ).call()
      if (
        parent.type === "UnaryExpression" ||
        parent.type === "MemberExpression"
      ) {
        return group(
          concat([indent(concat([softline, concat(parts)])), softline])
        );
      }

      const shouldNotIndent = parent.type === "ReturnStatement";

      const shouldIndentIfInlining =
        parent.type === "AssignmentStatement" ||
        parent.type === "LocalStatement" ||
        parent.type === "TableValue" ||
        parent.type === "TableKeyString" ||
        parent.type === "TableKey";

      const samePrecedenceSubExpression =
        isBinaryish(node.left) &&
        shouldFlatten(node.operator, node.left.operator);

      if (
        shouldNotIndent ||
        (shouldInlineLogicalExpression(node) && !samePrecedenceSubExpression) ||
        (!shouldInlineLogicalExpression(node) && shouldIndentIfInlining)
      ) {
        return group(concat(parts));
      }

      const rest = concat(parts.slice(1));

      return group(
        concat([
          // Don't include the initial expression in the indentation
          // level. The first item is guaranteed to be the first
          // left-most expression.
          parts.length > 0 ? parts[0] : "",
          indent(rest),
        ])
      );
    }

    case "IfClause":
    case "ElseifClause": {
      const printedBody = printIndentedBody(path, options, print);
      return concat([
        node.type === "ElseifClause" ? "else" : "",
        "if ",
        path.call(print, "condition"),
        " then",
        willBreak(printedBody) ? breakParent : " ",
        printedBody,
      ]);
    }
    case "ElseClause": {
      return concat(["else ", printIndentedBody(path, options, print)]);
    }

    case "ReturnStatement": {
      return concat([
        "return",
        node.arguments.length === 0 ? "" : " ",
        join(", ", path.map(print, "arguments")),
      ]);
    }

    case "UnaryExpression": {
      return concat([
        node.operator,
        node.operator.match(/^[a-zA-Z]+$/) ? " " : "",
        path.call(print, "argument"),
      ]);
    }

    case "ForGenericStatement": {
      return concat([
        "for",
        group(
          concat([
            indent(
              concat([
                line,
                join(concat([",", line]), path.map(print, "variables")),
              ])
            ),
            line,
          ])
        ),
        "in",
        group(
          concat([
            indent(
              concat([
                line,
                join(concat([",", line]), path.map(print, "iterators")),
              ])
            ),
            line,
          ])
        ),
        "do",
        printIndentedBody(path, options, print),
        hardline,
        "end",
      ]);
    }
    case "ForNumericStatement": {
      return concat([
        "for ",
        path.call(print, "variable"),
        " = ",
        path.call(print, "start"),
        ", ",
        path.call(print, "end"),
        node.step ? ", " : "",
        node.step ? path.call(print, "step") : "",
        " do",
        printIndentedBody(path, options, print),
        hardline,
        "end",
      ]);
    }

    case "DoStatement": {
      return concat([
        "do",
        printIndentedBody(path, options, print),
        hardline,
        "end",
      ]);
    }

    case "WhileStatement": {
      return concat([
        "while ",
        path.call(print, "condition"),
        " do",
        printIndentedBody(path, options, print),
        hardline,
        "end",
      ]);
    }

    case "RepeatStatement": {
      return concat([
        "repeat",
        printIndentedBody(path, options, print),
        hardline,
        "until ",
        path.call(print, "condition"),
      ]);
    }

    case "BreakStatement": {
      return "break";
    }

    case "LabelStatement": {
      return concat(["::", path.call(print, "label"), "::"]);
    }
    case "GotoStatement": {
      return concat(["goto ", path.call(print, "label")]);
    }
  }

  return "";
}

function printIndentedBody(path, options, print) {
  const node = path.getValue();
  const hasContent =
    node.body.length > 0 ||
    (node.comments && node.comments.filter(isDanglingComment).length > 0);

  const isSimpleReturn =
    node.type === "IfClause" &&
    node.body.length === 1 &&
    node.body[0].type === "ReturnStatement" &&
    (node.body[0].comments == null || node.body[0].comments.length === 0) &&
    node.body[0].arguments.length === 0;

  if (isSimpleReturn) {
    return printBody(path, options, print);
  } else {
    return hasContent
      ? indent(concat([hardline, printBody(path, options, print)]))
      : "";
  }
}

function printBody(path, options, print) {
  const node = path.getValue();
  const printed = [];

  path.map((statementPath, index) => {
    const statement = statementPath.getValue();

    // Just in case the AST has been modified to contain falsy
    // "statements," it's safer simply to skip them.
    /* istanbul ignore if */
    if (!statement) {
      return;
    }

    const statementPrinted = print(statementPath);
    const text = options.originalText;
    const parts = [];

    parts.push(statementPrinted);

    const nextStatement = node.body[index + 1];
    if (
      nextStatement &&
      couldBeCallExpressionBase(getRightmostNode(statement, node)) &&
      willHaveLeadingParen(nextStatement, node)
    ) {
      parts.push(";");
    }

    if (
      isNextLineEmpty(text, statement, options) &&
      !isLastStatement(statementPath)
    ) {
      parts.push(hardline);
    }

    printed.push(concat(parts));
  }, "body");

  return group(
    concat([
      join(hardline, printed),
      printDanglingComments(path, options, /* sameIndent */ true),
    ])
  );
}

function couldBeCallExpressionBase(node) {
  if (node.type === "Identifier") {
    return true;
  }

  if (isExpression(node) && node.inParens) {
    return true;
  }

  if (
    node.type === "CallStatement" &&
    node.expression.type === "CallExpression"
  ) {
    return true;
  }

  return false;
}

function shouldHaveParens(node, parent) {
  if (!node.inParens) {
    return false;
  }

  switch (node.type) {
    case "Identifier":
    case "IndexExpression":
    case "MemberExpression": {
      return false;
    }

    case "CallExpression":
    case "VarargLiteral":
    case "TableCallExpression":
    case "StringCallExpression": {
      if (parent.type === "TableValue") {
        return true;
      } else if (parent.type === "ReturnStatement") {
        return !(parent.arguments.indexOf(node) < parent.arguments.length - 1);
      } else if (
        parent.type === "LocalStatement" ||
        parent.type === "AssignmentStatement"
      ) {
        if (parent.variables.length <= parent.init.length) {
          return false;
        }

        return !(parent.init.indexOf(node) < parent.init.length - 1);
      }

      return false;
    }

    case "BooleanLiteral":
    case "NilLiteral":
    case "NumericLiteral":
    case "StringLiteral":
    case "TableConstructorExpression":
    case "UnaryExpression":
    case "FunctionDeclaration": {
      return (
        (parent.type === "CallExpression" ||
          parent.type === "MemberExpression" ||
          parent.type === "IndexExpression" ||
          parent.type === "TableCallExpression" ||
          parent.type === "StringCallExpression") &&
        parent.base === node
      );
    }

    case "BinaryExpression":
    case "LogicalExpression": {
      // Don't mess with parens in binary or logical expressions because
      // people don't have math/operator precedences memorized, so adding
      // parens helps make the code more readable.
      return true;
    }
  }

  return true;
}

function willHaveLeadingParen(node, parent) {
  if (shouldHaveParens(node, parent)) {
    return true;
  }

  if (node.type === "CallStatement") {
    return willHaveLeadingParen(node.expression.base, node.expression);
  } else if (
    node.type === "MemberExpression" ||
    node.type === "IndexExpression"
  ) {
    return willHaveLeadingParen(node.base, node);
  }

  return false;
}

function getRightmostNode(node, parent) {
  if (node == null) {
    debugger;
  }

  switch (node.type) {
    case "LocalStatement":
    case "AssignmentStatement": {
      if (node.init.length > 0) {
        return getRightmostNode(node.init[node.init.length - 1], node);
      } else {
        return node;
      }
    }
    case "BinaryExpression":
    case "LogicalExpression": {
      if (shouldHaveParens(node, parent)) {
        return node;
      }
      return getRightmostNode(node.right, node);
    }
  }

  return node;
}

function isLastStatement(path) {
  const parent = path.getParentNode();
  if (!parent) {
    return true;
  }
  const node = path.getValue();
  const body = parent.body;
  return body && body[body.length - 1] === node;
}

function printString(raw, options) {
  // `rawContent` is the string exactly like it appeared in the input source
  // code, without its enclosing quotes.
  const rawContent = raw.slice(1, -1);

  const double = { quote: '"', regex: /"/g };
  const single = { quote: "'", regex: /'/g };

  const preferred = options.singleQuote ? single : double;
  const alternate = preferred === single ? double : single;

  let shouldUseAlternateQuote = false;

  // If `rawContent` contains at least one of the quote preferred for enclosing
  // the string, we might want to enclose with the alternate quote instead, to
  // minimize the number of escaped quotes.
  // Also check for the alternate quote, to determine if we're allowed to swap
  // the quotes on a DirectiveLiteral.
  if (
    rawContent.includes(preferred.quote) ||
    rawContent.includes(alternate.quote)
  ) {
    const numPreferredQuotes = (rawContent.match(preferred.regex) || []).length;
    const numAlternateQuotes = (rawContent.match(alternate.regex) || []).length;

    shouldUseAlternateQuote = numPreferredQuotes > numAlternateQuotes;
  }

  const enclosingQuote = shouldUseAlternateQuote
    ? alternate.quote
    : preferred.quote;

  // It might sound unnecessary to use `makeString` even if the string already
  // is enclosed with `enclosingQuote`, but it isn't. The string could contain
  // unnecessary escapes (such as in `"\'"`). Always using `makeString` makes
  // sure that we consistently output the minimum amount of escaped quotes.
  return makeString(rawContent, enclosingQuote, false);
}

function printArgumentsList(path, options, print) {
  const args = path.getValue().arguments;

  if (args.length === 0) {
    return "()";
  }

  let anyArgEmptyLine = false;
  let hasEmptyLineFollowingFirstArg = false;
  const lastArgIndex = args.length - 1;
  const printedArguments = path.map((argPath, index) => {
    const arg = argPath.getNode();
    const parts = [print(argPath)];

    if (index === lastArgIndex) {
      // do nothing
    } else if (isNextLineEmpty(options.originalText, arg, options)) {
      if (index === 0) {
        hasEmptyLineFollowingFirstArg = true;
      }

      anyArgEmptyLine = true;
      parts.push(",", hardline, hardline);
    } else {
      parts.push(",", line);
    }

    return concat(parts);
  }, "arguments");

  const shouldGroupFirst = shouldGroupFirstArg(args);
  const shouldGroupLast = shouldGroupLastArg(args);
  if (shouldGroupFirst || shouldGroupLast) {
    const shouldBreak =
      (shouldGroupFirst
        ? printedArguments.slice(1).some(willBreak)
        : printedArguments.slice(0, -1).some(willBreak)) || anyArgEmptyLine;

    // We want to print the last argument with a special flag
    let printedExpanded;
    let i = 0;
    path.each((argPath) => {
      if (shouldGroupFirst && i === 0) {
        printedExpanded = [
          concat([
            argPath.call((p) => print(p, { expandFirstArg: true })),
            printedArguments.length > 1 ? "," : "",
            hasEmptyLineFollowingFirstArg ? hardline : line,
            hasEmptyLineFollowingFirstArg ? hardline : "",
          ]),
        ].concat(printedArguments.slice(1));
      }
      if (shouldGroupLast && i === args.length - 1) {
        printedExpanded = printedArguments
          .slice(0, -1)
          .concat(argPath.call((p) => print(p, { expandLastArg: true })));
      }
      i++;
    }, "arguments");

    const somePrintedArgumentsWillBreak = printedArguments.some(willBreak);

    return concat([
      somePrintedArgumentsWillBreak ? breakParent : "",
      conditionalGroup(
        [
          concat([
            ifBreak(
              indent(concat(["(", softline, concat(printedExpanded)])),
              concat(["(", concat(printedExpanded)])
            ),
            somePrintedArgumentsWillBreak ? softline : "",
            ")",
          ]),
          shouldGroupFirst
            ? concat([
                "(",
                group(printedExpanded[0], { shouldBreak: true }),
                concat(printedExpanded.slice(1)),
                ")",
              ])
            : concat([
                "(",
                concat(printedArguments.slice(0, -1)),
                group(getLast(printedExpanded), {
                  shouldBreak: true,
                }),
                ")",
              ]),
          group(
            concat([
              "(",
              indent(concat([line, concat(printedArguments)])),
              line,
              ")",
            ]),
            { shouldBreak: true }
          ),
        ],
        { shouldBreak }
      ),
    ]);
  }

  return group(
    concat([
      "(",
      indent(concat([softline, concat(printedArguments)])),
      // ifBreak(shouldPrintComma(options, "all") ? "," : ""),
      softline,
      ")",
    ]),
    { shouldBreak: printedArguments.some(willBreak) || anyArgEmptyLine }
  );
}

function shouldGroupFirstArg(args) {
  if (args.length !== 2) {
    return false;
  }

  const firstArg = args[0];
  const secondArg = args[1];
  return (
    // (!firstArg.comments || !firstArg.comments.length) &&
    firstArg.type === "FunctionDeclaration" && !couldGroupArg(secondArg)
  );
}

function shouldGroupLastArg(args) {
  const lastArg = getLast(args);
  const penultimateArg = getPenultimate(args);
  return (
    couldGroupArg(lastArg) &&
    // If the last two arguments are of the same type,
    // disable last element expansion.
    (!penultimateArg || penultimateArg.type !== lastArg.type)
  );
}

function couldGroupArg(arg) {
  return (
    arg.type === "FunctionDeclaration" ||
    arg.type === "TableConstructorExpression"
  );
}

function getPenultimate(arr) {
  if (arr.length > 1) {
    return arr[arr.length - 2];
  }
  return null;
}

function getLast(arr) {
  if (arr.length > 0) {
    return arr[arr.length - 1];
  }
  return null;
}

function isBinaryish(node) {
  return node.type === "BinaryExpression" || node.type === "LogicalExpression";
}

function shouldInlineLogicalExpression(node) {
  if (node.type !== "LogicalExpression") {
    return false;
  }

  if (
    node.right.type === "TableConstructorExpression" &&
    node.right.fields.length !== 0
  ) {
    return true;
  }

  return false;
}

// For binary expressions to be consistent, we need to group
// subsequent operators with the same precedence level under a single
// group. Otherwise they will be nested such that some of them break
// onto new lines but not all. Operators with the same precedence
// level should either all break or not. Because we group them by
// precedence level and the AST is structured based on precedence
// level, things are naturally broken up correctly, i.e. `and` is
// broken before `+`.
function printBinaryishExpressions(
  path,
  print,
  options,
  isNested,
  isInsideParenthesis
) {
  let parts = [];
  const node = path.getValue();

  // We treat BinaryExpression and LogicalExpression nodes the same.
  if (isBinaryish(node)) {
    // Put all operators with the same precedence level in the same
    // group. The reason we only need to do this with the `left`
    // expression is because given an expression like `1 + 2 - 3`, it
    // is always parsed like `((1 + 2) - 3)`, meaning the `left` side
    // is where the rest of the expression will exist. Binary
    // expressions on the right side mean they have a difference
    // precedence level and should be treated as a separate group, so
    // print them normally. (This doesn't hold for the `^` operator,
    // which is unique in that it is right-associative.)
    if (shouldFlatten(node.operator, node.left.operator)) {
      // Flatten them out by recursively calling this function.
      parts = parts.concat(
        path.call(
          (left) =>
            printBinaryishExpressions(
              left,
              print,
              options,
              /* isNested */ true,
              isInsideParenthesis
            ),
          "left"
        )
      );
    } else {
      parts.push(path.call(print, "left"));
    }

    const shouldInline = shouldInlineLogicalExpression(node);

    const right = shouldInline
      ? concat([node.operator, " ", path.call(print, "right")])
      : concat([node.operator, line, path.call(print, "right")]);

    // If there's only a single binary expression, we want to create a group
    // in order to avoid having a small right part like -1 be on its own line.
    const parent = path.getParentNode();
    const shouldGroup =
      !(isInsideParenthesis && node.type === "LogicalExpression") &&
      parent.type !== node.type &&
      node.left.type !== node.type &&
      node.right.type !== node.type;

    parts.push(" ", shouldGroup ? group(right) : right);

    // The root comments are already printed, but we need to manually print
    // the other ones since we don't call the normal print on BinaryExpression,
    // only for the left and right parts
    if (isNested && node.comments) {
      parts = printComments(path, () => concat(parts), options);
    }
  } else {
    // Our stopping case. Simply print the node normally.
    parts.push(path.call(print));
  }

  return parts;
}

module.exports = function genericPrint(path, options, print) {
  const printed = printNoParens(path, options, print);

  const node = path.getValue();
  if (shouldHaveParens(node, path.getParentNode())) {
    return concat(["(", printed, ")"]);
  } else {
    return printed;
  }
};
