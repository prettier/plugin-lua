"use strict";

/**
 * This function takes the existing ast node and a copy, by reference
 * We use it for testing, so that we can compare pre-post versions of the AST,
 * excluding things we don't care about (like node location, case that will be
 * changed by the printer, etc.)
 */
function clean(node, newObj) {}

module.exports = clean;
