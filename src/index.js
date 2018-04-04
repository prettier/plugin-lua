"use strict";

const parse = require("./parser");
const print = require("./printer");
const clean = require("./clean");
const options = require("./options");

const languages = [
  {
    name: "Lua",
    parsers: ["lua51"],
    tmScope: "source.lua",
    aceMode: "lua",
    codemirrorMode: "lua",
    extensions: [".lua", ".fcgi", ".nse", ".p8", ".pd_lua", ".rbxs", ".wlua"],
    filenames: [],
    vscodeLanguageIds: ["lua"],
    linguistLanguageId: 213,
  },
];

const parsers = {
  lua51: {
    parse: function parseLua51(text, parsers, options) {
      return parse(
        text,
        parsers,
        Object.assign({}, options, {
          luaVersion: "5.1",
        })
      );
    },
    astFormat: "luaparse",
    locStart: function locStart(node) {
      return node.range[0];
    },
    locEnd: function locEnd(node) {
      return node.range[1];
    },
  },
};

const printers = {
  luaparse: {
    print,
  },
};

module.exports = {
  languages,
  printers,
  parsers,
  options,
  defaultOptions: {
    tabWidth: 4,
    useTabs: true,
  },
};
