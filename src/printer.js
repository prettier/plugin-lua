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

  switch (node.type) {
    case "Chunk": {
      return join(hardline, path.map(print, "body"));
    }
    case "LocalStatement": {
      return concat([
        "local ",
        join(", ", path.map(print, "variables")),
        node.init.length > 0
          ? concat([" = ", join(", ", path.map(print, "init"))])
          : "",
      ]);
    }
    case "Identifier": {
      return node.name;
    }
    case "NumericLiteral": {
      return node.raw;
    }
    case "FunctionDeclaration": {
      return concat([
        node.isLocal ? "local " : "",
        "function",
        node.identifier ? " " : "",
        path.call(print, "identifier"),
        "(",
        join(", ", path.map(print, "parameters")),
        ")",
        indent(concat([hardline, join(hardline, path.map(print, "body"))])),
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
    case "StringLiteral": {
      return node.raw;
    }
  }

  return "";
}

module.exports = genericPrint;
