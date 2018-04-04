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
function print(path, options, print) {
  return "";
}

module.exports = print;
