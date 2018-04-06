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
} = require("prettier").doc.builders;
const { willBreak } = require("prettier").doc.utils;
const { makeString, isNextLineEmpty } = require("prettier").util;
const { isValidIdentifier } = require("./util");

function printNoParens(path, options, print) {
  const node = path.getValue();

  switch (node.type) {
    case "Chunk": {
      return path.call(
        (statementPath) =>
          printStatementSequence(statementPath, options, print),
        "body"
      );
    }
    case "AssignmentStatement": {
      return concat([
        group(
          concat([
            concat([
              indent(join(concat([",", line]), path.map(print, "variables"))),
            ]),
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
                        concat([
                          join(concat([",", line]), path.map(print, "init")),
                        ]),
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
            concat([
              indent(join(concat([",", line]), path.map(print, "variables"))),
            ]),
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
                        concat([
                          join(concat([",", line]), path.map(print, "init")),
                        ]),
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
            concat([
              indent(join(concat([",", line]), path.map(print, "parameters"))),
            ]),
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
        "(",
        group(
          concat([
            softline,
            concat([
              indent(join(concat([",", line]), path.map(print, "arguments"))),
            ]),
            softline,
          ])
        ),
        ")",
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
                concat([
                  join(concat([",", line]), path.map(print, "variables")),
                ]),
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
                concat([
                  join(concat([",", line]), path.map(print, "iterators")),
                ]),
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
    ? indent(
        concat([
          hardline,
          path.call(
            (statementPath) =>
              printStatementSequence(statementPath, options, print),
            "body"
          ),
        ])
      )
    : "";
}

function printStatementSequence(path, options, print) {
  const printed = [];

  path.map((stmtPath) => {
    const stmt = stmtPath.getValue();

    // Just in case the AST has been modified to contain falsy
    // "statements," it's safer simply to skip them.
    /* istanbul ignore if */
    if (!stmt) {
      return;
    }

    const stmtPrinted = print(stmtPath);
    const text = options.originalText;
    const parts = [];

    parts.push(stmtPrinted);

    if (isNextLineEmpty(text, stmt, options) && !isLastStatement(stmtPath)) {
      parts.push(hardline);
    }

    printed.push(concat(parts));
  });

  return join(hardline, printed);
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

module.exports = function genericPrint(path, options, print) {
  const printed = printNoParens(path, options, print);

  const node = path.getValue();
  if (node.inParens) {
    return concat(["(", printed, ")"]);
  } else {
    return printed;
  }
};
