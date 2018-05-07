"use strict";

const {
  addLeadingComment,
  addDanglingComment,
  addTrailingComment,
} = require("prettier").util;
const {
  concat,
  join,
  indent,
  hardline,
  cursor,
  breakParent,
  lineSuffix,
} = require("prettier").doc.builders;
const {
  isValidIdentifier,
  isExpression,
  hasNewline,
  isPreviousLineEmpty,
  skipNewline,
} = require("./util");

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

function printLeadingComment(commentPath, print, options) {
  const comment = commentPath.getValue();
  const contents = printComment(commentPath, options);
  if (!contents) {
    return "";
  }
  const isBlock =
    options.printer.isBlockComment && options.printer.isBlockComment(comment);

  // Leading block comments should see if they need to stay on the
  // same line or not.
  if (isBlock) {
    return concat([
      contents,
      hasNewline(options.originalText, options.locEnd(comment))
        ? hardline
        : " ",
    ]);
  }

  return concat([contents, hardline]);
}

function printTrailingComment(commentPath, print, options) {
  const comment = commentPath.getValue();
  const contents = printComment(commentPath, options);
  if (!contents) {
    return "";
  }
  const isBlock =
    options.printer.isBlockComment && options.printer.isBlockComment(comment);

  // We don't want the line to break
  // when the parentParentNode is a ClassDeclaration/-Expression
  // And the parentNode is in the superClass property
  const parentNode = commentPath.getNode(1);
  const parentParentNode = commentPath.getNode(2);
  const isParentSuperClass =
    parentParentNode &&
    (parentParentNode.type === "ClassDeclaration" ||
      parentParentNode.type === "ClassExpression") &&
    parentParentNode.superClass === parentNode;

  if (
    hasNewline(options.originalText, options.locStart(comment), {
      backwards: true,
    })
  ) {
    // This allows comments at the end of nested structures:
    // {
    //   x: 1,
    //   y: 2
    //   // A comment
    // }
    // Those kinds of comments are almost always leading comments, but
    // here it doesn't go "outside" the block and turns it into a
    // trailing comment for `2`. We can simulate the above by checking
    // if this a comment on its own line; normal trailing comments are
    // always at the end of another expression.

    const isLineBeforeEmpty = isPreviousLineEmpty(
      options.originalText,
      comment,
      options.locStart
    );

    return lineSuffix(
      concat([hardline, isLineBeforeEmpty ? hardline : "", contents])
    );
  } else if (isBlock || isParentSuperClass) {
    // Trailing block comments never need a newline
    return concat([" ", contents]);
  }

  return concat([lineSuffix(" " + contents), !isBlock ? breakParent : ""]);
}

function prependCursorPlaceholder(path, options, printed) {
  if (path.getNode() === options.cursorNode && path.getValue()) {
    return concat([cursor, printed, cursor]);
  }
  return printed;
}

function printComments(path, print, options, needsSemi) {
  const value = path.getValue();
  const printed = print(path);
  const comments = value && value.comments;

  if (!comments || comments.length === 0) {
    return prependCursorPlaceholder(path, options, printed);
  }

  const leadingParts = [];
  const trailingParts = [needsSemi ? ";" : "", printed];

  path.each((commentPath) => {
    const comment = commentPath.getValue();
    const leading = comment.leading;
    const trailing = comment.trailing;

    if (leading) {
      const contents = printLeadingComment(commentPath, print, options);
      if (!contents) {
        return;
      }
      leadingParts.push(contents);

      const text = options.originalText;
      if (hasNewline(text, skipNewline(text, options.locEnd(comment)))) {
        leadingParts.push(hardline);
      }
    } else if (trailing) {
      trailingParts.push(printTrailingComment(commentPath, print, options));
    }
  }, "comments");

  return prependCursorPlaceholder(
    path,
    options,
    concat(leadingParts.concat(trailingParts))
  );
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
  printComments,
  isDanglingComment,
  isLeadingComment,
  isTrailingComment,
  isBlockComment,
};
