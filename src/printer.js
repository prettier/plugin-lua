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
const { isValidIdentifier } = require("./util");

function printNoParens(path, options, print) {
  const node = path.getValue();

  switch (node.type) {
    case "Chunk": {
      return printBody(path, options, print);
    }
    case "AssignmentStatement": {
      return concat([
        group(
          concat([
            indent(join(concat([",", line]), path.map(print, "variables"))),
            line,
          ])
        ),
        node.init.length > 0
          ? concat([
              "=",
              group(
                node.init.length === 1 &&
                node.init[0].type === "TableConstructorExpression"
                  ? concat([" ", path.call(print, "init", 0)])
                  : indent(
                      concat([
                        line,
                        join(concat([",", line]), path.map(print, "init")),
                      ])
                    )
              ),
            ])
          : "",
      ]);
    }
    case "LocalStatement": {
      return concat([
        group(
          concat([
            "local ",
            indent(join(concat([",", line]), path.map(print, "variables"))),
            line,
          ])
        ),
        node.init.length > 0
          ? concat([
              "=",
              group(
                node.init.length === 1 &&
                node.init[0].type === "TableConstructorExpression"
                  ? concat([" ", path.call(print, "init", 0)])
                  : indent(
                      concat([
                        line,
                        join(concat([",", line]), path.map(print, "init")),
                      ])
                    )
              ),
            ])
          : "",
      ]);
    }
    case "Identifier": {
      return node.name;
    }
    case "FunctionDeclaration": {
      return concat([
        node.isLocal ? "local " : "",
        "function",
        node.identifier ? concat([" ", path.call(print, "identifier")]) : "",
        "(",
        group(
          concat([
            softline,
            indent(join(concat([",", line]), path.map(print, "parameters"))),
            softline,
          ])
        ),
        ")",
        printIndentedBody(path, options, print),
        hardline,
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
      } else {
        return concat([
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
    case "LogicalExpression":
    case "BinaryExpression": {
      return concat([
        path.call(print, "left"),
        " ",
        node.operator,
        " ",
        path.call(print, "right"),
      ]);
    }
    case "IfStatement": {
      return concat([
        join(hardline, path.map(print, "clauses")),
        hardline,
        "end",
      ]);
    }

    case "IfClause":
    case "ElseifClause": {
      return concat([
        node.type === "ElseifClause" ? "else" : "",
        "if ",
        path.call(print, "condition"),
        " then",
        printIndentedBody(path, options, print),
      ]);
    }
    case "ElseClause": {
      return concat(["else ", printIndentedBody(path, options, print)]);
    }

    case "ReturnStatement": {
      return concat(["return ", join(", ", path.map(print, "arguments"))]);
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

  return node.body.length > 0
    ? indent(concat([hardline, printBody(path, options, print)]))
    : "";
}

function printBody(path, options, print) {
  const node = path.getValue();
  const statementNodes = node.body;

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

    const nextStatement = statementNodes[index + 1];
    if (
      nextStatement &&
      willHaveTrailingParen(statement) &&
      willHaveLeadingParen(nextStatement)
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

  return join(hardline, printed);
}

function willHaveLeadingParen(node) {
  return (
    node.inParens ||
    (node.type === "CallStatement" && node.expression.base.inParens) ||
    (node.type === "MemberExpression" && node.expression.base.inParens) ||
    (node.type === "IndexExpression" && node.expression.base.inParens)
  );
}

function willHaveTrailingParen(node) {
  return (
    node.inParens ||
    (node.type === "CallStatement" &&
      node.expression.type === "CallExpression") ||
    ((node.type === "LocalStatement" || node.type === "AssignmentStatement") &&
      willHaveTrailingParen(node.init[node.init.length - 1])) ||
    ((node.type === "BinaryExpression" || node.type === "LogicalExpression") &&
      willHaveTrailingParen(node.right))
  );
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

module.exports = function genericPrint(path, options, print) {
  const printed = printNoParens(path, options, print);

  const node = path.getValue();
  if (node.inParens) {
    return concat(["(", printed, ")"]);
  } else {
    return printed;
  }
};
