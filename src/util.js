function isValidIdentifier(str) {
  return Boolean(str.match(/^[A-Za-z_][A-Za-z_0-9]*$/));
}

module.exports = { isValidIdentifier };
