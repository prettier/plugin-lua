"use strict";
const luaparse = require("luaparse");

function parse(text, parsers, options) {
  return luaparse.parse(text, {
    ranges: true,
    luaVersion: "5.3",
    encodingMode: "pseudo-latin1",
  });
}

module.exports = parse;
