"use strict";

const parse = require("./parser");
const print = require("./printer");
const options = require("./options");
const clean = require("./clean");
const {
  handleComments,
  getCommentChildNodes,
  canAttachComment,
  printComment,
  isBlockComment,
} = require("./comments");

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
    parse,
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
    massageAstNode: clean,
    handleComments,
    getCommentChildNodes,
    canAttachComment,
    printComment,
    isBlockComment,
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
