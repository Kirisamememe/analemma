import { isDirective, isTsdoc } from "./comment-kinds.mjs";
import { countCodeLines, lineStartOf } from "./lines.mjs";
import { findSectionDividers } from "./section-dividers.mjs";

const DEFAULT_MAX_TRAILING_LENGTH = 40;
const DEFAULT_DIVIDER_ALLOWED_AFTER = 200;
const DEFAULT_DIVIDER_REQUIRED_AFTER = 400;

const TOP_LEVEL_DECLARATIONS = new Set([
  "ClassDeclaration",
  "ExportDefaultDeclaration",
  "ExportNamedDeclaration",
  "FunctionDeclaration",
  "TSEnumDeclaration",
  "TSInterfaceDeclaration",
  "TSModuleDeclaration",
  "TSTypeAliasDeclaration",
  "VariableDeclaration",
]);

const MEMBER_SELECTOR = [
  "AccessorProperty",
  "MethodDefinition",
  "Property",
  "PropertyDefinition",
  "TSCallSignatureDeclaration",
  "TSConstructSignatureDeclaration",
  "TSEnumMember",
  "TSIndexSignature",
  "TSMethodSignature",
  "TSPropertySignature",
].join(", ");

const nextCodeIndex = ({ commentsByStart, from, text }) => {
  let index = from;

  for (;;) {
    const match = /\S/v.exec(text.slice(index));

    if (!match) {
      return text.length;
    }

    const start = index + match.index;
    const comment = commentsByStart.get(start);

    if (comment === undefined || !isDirective(comment)) {
      return start;
    }

    index = comment.end;
  }
};

const hasCodeBefore = (text, start) =>
  text.slice(lineStartOf(text, start), start).trim() !== "";

const hasCodeAfter = ({ comments, end, text }) =>
  countCodeLines({
    comments: comments
      .filter((comment) => comment.start >= end)
      .map((comment) => ({
        end: comment.end - end,
        start: comment.start - end,
      })),
    text: text.slice(end),
  }) > 0;

const noStandaloneComment = {
  meta: {
    type: "problem",
    docs: {
      description:
        "単独の行のコメント、ブロックコメント、宣言の直前に無い TSDoc を禁止し、長いファイルに分割の見出しを求める。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          maxTrailingLength: {
            type: "integer",
            minimum: 1,
          },
          dividerAllowedAfter: {
            type: "integer",
            minimum: 1,
          },
          dividerRequiredAfter: {
            type: "integer",
            minimum: 1,
          },
        },
      },
    ],
    messages: {
      standalone:
        "単独の行のコメントは書かないでください。仕様や振る舞いはテストで表し、理由は一番近い DECISIONS.md に書きます。",
      block:
        "ブロックコメント(/* */)は書かないでください。説明が要るなら、短い行末のコメントを付けます。",
      tooLong:
        "行末のコメントは {{max}} 文字までです。長い説明は、テストか一番近い DECISIONS.md に書きます。",
      misplacedTsdoc:
        "TSDoc は、宣言・型のプロパティ・クラスやオブジェクトのメンバーの直前にだけ書きます。",
      dividerInShortFile:
        "分割の見出しは、コードが {{allowed}} 行を超えるファイルでだけ使えます。このファイルのコードは {{lines}} 行です(空行とコメントだけの行は数えない)。",
      dividerRequired:
        "このファイルのコードは {{lines}} 行あります。コードが {{required}} 行を超えるファイルは、分割の見出し(罫線・見出しの行・罫線の3行の // コメント)で区切ります。先に、ファイルを分けられないかを考えます。",
      dividerTitleTooLong: "分割の見出しは {{max}} 文字までです。",
    },
  },
  /** ファイルごとに、コメントの置き場所と長さを調べる。 */
  create(context) {
    const options = context.options[0] ?? {};
    const maxTrailingLength =
      options.maxTrailingLength ?? DEFAULT_MAX_TRAILING_LENGTH;
    const dividerAllowedAfter =
      options.dividerAllowedAfter ?? DEFAULT_DIVIDER_ALLOWED_AFTER;
    const dividerRequiredAfter =
      options.dividerRequiredAfter ?? DEFAULT_DIVIDER_REQUIRED_AFTER;
    const documentable = new Set();
    const remember = (node) => {
      documentable.add(node.start);
    };

    return {
      Program(program) {
        for (const statement of program.body) {
          if (TOP_LEVEL_DECLARATIONS.has(statement.type)) {
            remember(statement);
          }
        }
      },
      [MEMBER_SELECTOR]: remember,
      "Program:exit"(program) {
        const { text } = context.sourceCode;
        const comments = context.sourceCode.getAllComments();
        const commentsByStart = new Map(
          comments.map((comment) => [comment.start, comment]),
        );
        const lines = countCodeLines({ comments, text });
        const dividers = findSectionDividers(
          comments.filter((comment) => !hasCodeBefore(text, comment.start)),
        );
        const dividerComments = new Set(
          dividers.flatMap(({ bottom, title, top }) => [top, title, bottom]),
        );
        const data = {
          allowed: String(dividerAllowedAfter),
          lines: String(lines),
          max: String(maxTrailingLength),
          required: String(dividerRequiredAfter),
        };

        for (const { title } of dividers) {
          if (lines <= dividerAllowedAfter) {
            context.report({
              loc: title.loc,
              messageId: "dividerInShortFile",
              data,
            });
          } else if (title.value.trim().length > maxTrailingLength) {
            context.report({
              loc: title.loc,
              messageId: "dividerTitleTooLong",
              data,
            });
          }
        }

        if (
          lines > dividerRequiredAfter &&
          !dividers.some(({ bottom }) =>
            hasCodeAfter({ comments, end: bottom.end, text }),
          )
        ) {
          context.report({ node: program, messageId: "dividerRequired", data });
        }

        for (const comment of comments) {
          if (isDirective(comment) || dividerComments.has(comment)) {
            continue;
          }

          if (isTsdoc(comment)) {
            if (
              !documentable.has(
                nextCodeIndex({ commentsByStart, from: comment.end, text }),
              )
            ) {
              context.report({ loc: comment.loc, messageId: "misplacedTsdoc" });
            }

            continue;
          }

          if (comment.type === "Block") {
            context.report({ loc: comment.loc, messageId: "block" });
            continue;
          }

          if (!hasCodeBefore(text, comment.start)) {
            context.report({ loc: comment.loc, messageId: "standalone" });
            continue;
          }

          if (comment.value.trim().length > maxTrailingLength) {
            context.report({ loc: comment.loc, messageId: "tooLong", data });
          }
        }
      },
    };
  },
};

export default noStandaloneComment;
