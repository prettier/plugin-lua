"use strict";
const luaparse = require("luaparse");

function parse(text, parsers, options) {
  return luaparse.parse(text, {
    ranges: true,
    locations: true,
    luaVersion: "5.3",
  });
}

module.exports = parse;
