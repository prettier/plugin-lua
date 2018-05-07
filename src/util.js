function isValidIdentifier(str) {
  return !isKeyword(str) && Boolean(str.match(/^[A-Za-z_][A-Za-z_0-9]*$/));
}

function isKeyword(str) {
  switch (str) {
    case "do":
    case "if":
    case "in":
    case "or":
    case "and":
    case "end":
    case "for":
    case "nil":
    case "not":
    case "else":
    case "then":
    case "true":
    case "goto":
    case "break":
    case "false":
    case "local":
    case "until":
    case "while":
    case "elseif":
    case "repeat":
    case "return":
    case "function":
      return true;
    default:
      return false;
  }
}

function isExpression(node) {
  switch (node.type) {
    case "Identifier":
    case "CallExpression":
    case "TableCallExpression":
    case "StringCallExpression":
    case "BooleanLiteral":
    case "NilLiteral":
    case "NumericLiteral":
    case "StringLiteral":
    case "VarargLiteral":
    case "IndexExpression":
    case "MemberExpression":
    case "UnaryExpression":
    case "TableConstructorExpression": {
      return true;
    }
    case "FunctionDeclaration": {
      return node.identifier == null;
    }
    case "BinaryExpression":
    case "LogicalExpression": {
      return node.inParens;
    }
  }
}

const PRECEDENCE = {};
[
  ["or"],
  ["and"],
  ["<", ">", "<=", ">=", "~=", "=="],
  ["|"],
  ["~"],
  ["&"],
  ["<<", ">>"],
  [".."],
  ["+", "-"],
  ["*", "/", "//", "%"],
  // ["not", "#", "-", "~"],
  ["^"],
].forEach((tier, i) => {
  tier.forEach((op) => {
    PRECEDENCE[op] = i;
  });
});

function getPrecedence(op) {
  return PRECEDENCE[op];
}

const equalityOperators = {
  "==": true,
  "~=": true,
};
const additiveOperators = {
  "+": true,
  "-": true,
};
const multiplicativeOperators = {
  "*": true,
  "/": true,
  "%": true,
};
const bitshiftOperators = {
  ">>": true,
  "<<": true,
};

function shouldFlatten(parentOp, nodeOp) {
  if (getPrecedence(nodeOp) !== getPrecedence(parentOp)) {
    // x + y % z --> (x + y) % z
    if (nodeOp === "%" && !additiveOperators[parentOp]) {
      return true;
    }

    return false;
  }

  // ^ is right-associative
  // x ^ y ^ z --> x ^ (y ^ z)
  if (parentOp === "^") {
    return false;
  }

  // x == y == z --> (x == y) == z
  if (equalityOperators[parentOp] && equalityOperators[nodeOp]) {
    return false;
  }

  // x * y % z --> (x * y) % z
  if (
    (nodeOp === "%" && multiplicativeOperators[parentOp]) ||
    (parentOp === "%" && multiplicativeOperators[nodeOp])
  ) {
    return false;
  }

  // x * y / z --> (x * y) / z
  // x / y * z --> (x / y) * z
  if (
    nodeOp !== parentOp &&
    multiplicativeOperators[nodeOp] &&
    multiplicativeOperators[parentOp]
  ) {
    return false;
  }

  // x << y << z --> (x << y) << z
  if (bitshiftOperators[parentOp] && bitshiftOperators[nodeOp]) {
    return false;
  }

  return true;
}

function skip(chars) {
  return (text, index, opts) => {
    const backwards = opts && opts.backwards;

    // Allow `skip` functions to be threaded together without having
    // to check for failures (did someone say monads?).
    if (index === false) {
      return false;
    }

    const length = text.length;
    let cursor = index;
    while (cursor >= 0 && cursor < length) {
      const c = text.charAt(cursor);
      if (chars instanceof RegExp) {
        if (!chars.test(c)) {
          return cursor;
        }
      } else if (chars.indexOf(c) === -1) {
        return cursor;
      }

      backwards ? cursor-- : cursor++;
    }

    if (cursor === -1 || cursor === length) {
      // If we reached the beginning or end of the file, return the
      // out-of-bounds cursor. It's up to the caller to handle this
      // correctly. We don't want to indicate `false` though if it
      // actually skipped valid characters.
      return cursor;
    }
    return false;
  };
}

const skipSpaces = skip(" \t");

// This one doesn't use the above helper function because it wants to
// test \r\n in order and `skip` doesn't support ordering and we only
// want to skip one newline. It's simple to implement.
function skipNewline(text, index, opts) {
  const backwards = opts && opts.backwards;
  if (index === false) {
    return false;
  }

  const atIndex = text.charAt(index);
  if (backwards) {
    if (text.charAt(index - 1) === "\r" && atIndex === "\n") {
      return index - 2;
    }
    if (
      atIndex === "\n" ||
      atIndex === "\r" ||
      atIndex === "\u2028" ||
      atIndex === "\u2029"
    ) {
      return index - 1;
    }
  } else {
    if (atIndex === "\r" && text.charAt(index + 1) === "\n") {
      return index + 2;
    }
    if (
      atIndex === "\n" ||
      atIndex === "\r" ||
      atIndex === "\u2028" ||
      atIndex === "\u2029"
    ) {
      return index + 1;
    }
  }

  return index;
}

function hasNewline(text, index, opts) {
  opts = opts || {};
  const idx = skipSpaces(text, opts.backwards ? index - 1 : index, opts);
  const idx2 = skipNewline(text, idx, opts);
  return idx !== idx2;
}

// Note: this function doesn't ignore leading comments unlike isNextLineEmpty
function isPreviousLineEmpty(text, node, locStart) {
  let idx = locStart(node) - 1;
  idx = skipSpaces(text, idx, { backwards: true });
  idx = skipNewline(text, idx, { backwards: true });
  idx = skipSpaces(text, idx, { backwards: true });
  const idx2 = skipNewline(text, idx, { backwards: true });
  return idx !== idx2;
}

module.exports = {
  isValidIdentifier,
  isExpression,
  shouldFlatten,
  hasNewline,
  isPreviousLineEmpty,
  skipNewline,
};
