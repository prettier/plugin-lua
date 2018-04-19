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

module.exports = { isValidIdentifier, isExpression };
