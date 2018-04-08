"use strict";
const { isValidIdentifier } = require("./util");

/**
 * This function takes the existing ast node and a copy, by reference
 * We use it for testing, so that we can compare pre-post versions of the AST,
 * excluding things we don't care about (like node location, case that will be
 * changed by the printer, etc.)
 */
function clean(node, newObj, parent) {
  if (
    node.type === "TableKey" &&
    node.key.type === "StringLiteral" &&
    isValidIdentifier(node.key.value)
  ) {
    // we convert TableKeys to TableKeyStrings
    return {
      type: "TableKeyString",
      key: { type: "Identifier", name: node.key.value },
      value: node.value,
    };
  }

  // We remove parens when it's safe to do so
  delete newObj.inParens;
}

module.exports = clean;
