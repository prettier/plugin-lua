"use strict";
const luaparse = require("luaparse");

function parse(text, parsers, options) {
  return luaparse.parse(
    text,
    Object.assign(
      {
        ranges: true,
      },
      options
    )
  );
}

module.exports = parse;
