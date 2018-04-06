"use strict";

const parse = require("./parser");
const print = require("./printer");
const options = require("./options");
const { isValidIdentifier } = require("./util");

const languages = [
  {
    name: "Lua",
    parsers: ["lua"],
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
  lua: {
    parse: function parseLua(text, parsers, options) {
      return parse(
        text,
        parsers,
        Object.assign({}, options, {
          luaVersion: "5.3",
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
    massageAstNode(node, newObj, parent) {
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
    },
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
