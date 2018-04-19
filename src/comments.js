"use strict";

const {
  addLeadingComment,
  addDanglingComment,
  addTrailingComment,
} = require("prettier").util;
const { concat, join, indent, hardline } = require("prettier").doc.builders;
const { isValidIdentifier, isExpression } = require("./util");

// https://github.com/prettier/prettier/blob/c052d9c0866025c6af1cf2e5ef086f53dc3effff/src/main/comments.js#L335
function printComment(commentPath, options) {
  const comment = commentPath.getValue();
  comment.printed = true;

  return comment.raw;
}

// https://github.com/prettier/prettier/blob/c052d9c0866025c6af1cf2e5ef086f53dc3effff/src/main/comments.js#L440
function printDanglingComments(path, options, sameIndent, filter) {
  const parts = [];
  const node = path.getValue();

  if (!node || !node.comments) {
    return "";
  }

  path.each((commentPath) => {
    const comment = commentPath.getValue();
    if (
      comment &&
      !comment.leading &&
      !comment.trailing &&
      (!filter || filter(comment))
    ) {
      parts.push(printComment(commentPath, options));
    }
  }, "comments");

  if (parts.length === 0) {
    return "";
  }

  if (sameIndent) {
    return join(hardline, parts);
  }
  return indent(concat([hardline, join(hardline, parts)]));
}

/*
Comment functions are meant to inspect various edge cases using given comment nodes,
with information about where those comment nodes exist in the tree (ie enclosingNode,
previousNode, followingNode), and then either call the built in functions to handle
certain cases (ie addLeadingComment, addTrailingComment, addDanglingComment), or just
let prettier core handle them. To signal that the plugin is taking over, the comment
handler function should return true, otherwise returning false signals that prettier
core should handle the comment

args:
  comment
  text
  options
  ast
  isLastComment
*/

const handleComments = {
  ownLine(comment, text, options, ast, isLastComment) {
    return (
      handleCommentInEmptyBody(comment, text, options, ast, isLastComment) ||
      false
    );
  },
  endOfLine(comment, text, options, ast, isLastComment) {
    return false;
  },
  remaining(comment, text, options, ast, isLastComment) {
    return false;
  },
};

function handleCommentInEmptyBody(comment, text, options, ast, isLastComment) {
  if (
    comment.enclosingNode &&
    comment.enclosingNode.body &&
    comment.enclosingNode.body.length === 0
  ) {
    addDanglingComment(comment.enclosingNode, comment);
    return true;
  }

  return false;
}

function canAttachComment(node) {
  return true;
}

function getCommentChildNodes(node) {
  const children = [];
  Object.keys(node).forEach((key) => {
    const value = node[key];
    if (value == null) return;
    if (key === "range") return;
    if (key === "comments") return;

    if (typeof value === "object") {
      if (value.type) {
        children.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((node, key) => {
          children.push(node);
        });
      }
    }
  });

  return children;
}

function isDanglingComment(comment) {
  return !comment.leading && !comment.trailing;
}

function isLeadingComment(comment) {
  return comment.leading;
}

function isTrailingComment(comment) {
  return comment.trailing;
}

function isBlockComment(comment) {
  return /^\-\-\[=*\[/.test(comment.raw);
}

module.exports = {
  handleComments,
  printDanglingComments,
  getCommentChildNodes,
  canAttachComment,
  printComment,
  isDanglingComment,
  isLeadingComment,
  isTrailingComment,
  isBlockComment,
};
