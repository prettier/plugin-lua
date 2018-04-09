function isValidIdentifier(str) {
  return Boolean(str.match(/^[A-Za-z_][A-Za-z_0-9]*$/));
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
