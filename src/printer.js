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

// function print(
//   // Path to the AST node to print
//   path: FastPath,
//   options: object,
//   // Recursively print a child node
//   print: (path: FastPath) => Doc
// ): Doc;
function genericPrint(path, options, print) {
  const node = path.getValue();

  if (node === null) console.log(path);

  switch (node.type) {
    case "Chunk": {
      return path.call(
        (statementPath) =>
          printStatementSequence(statementPath, options, print),
        "body"
      );
    }
    case "AssignmentStatement":
    case "LocalStatement": {
      return concat([
        node.type === "LocalStatement" ? "local " : "",
        join(", ", path.map(print, "variables")),
        node.init.length > 0
          ? concat([" = ", join(", ", path.map(print, "init"))])
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
        join(", ", path.map(print, "parameters")),
        ")",
        indent(
          concat([
            hardline,
            path.call(
              (statementPath) =>
                printStatementSequence(statementPath, options, print),
              "body"
            ),
          ])
        ),
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
        join(", ", path.map(print, "arguments")),
        ")",
      ]);
    }
    case "BooleanLiteral":
    case "NilLiteral":
    case "NumericLiteral":
    case "StringLiteral": {
      return node.raw;
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
      return concat([
        "[",
        path.call(print, "key"),
        "]",
        " = ",
        path.call(print, "value"),
      ]);
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
        indent(
          concat([
            hardline,
            path.call(
              (statementPath) =>
                printStatementSequence(statementPath, options, print),
              "body"
            ),
          ])
        ),
      ]);
    }
    case "ElseClause": {
      return concat([
        "else ",
        indent(
          concat([
            hardline,
            path.call(
              (statementPath) =>
                printStatementSequence(statementPath, options, print),
              "body"
            ),
          ])
        ),
      ]);
    }
  }

  return "";
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

module.exports = genericPrint;
