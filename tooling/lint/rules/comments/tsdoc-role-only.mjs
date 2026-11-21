import { isTsdoc } from "./comment-kinds.mjs";

const DEFAULT_MAX_LENGTH = 60;
const ALLOWED_TAGS = new Set(["@deprecated", "@param", "@returns"]);
const BEHAVIOR =
  /場合|ならば?[、,]|[れけ]ば[、,]|たら[、,]|とき[は、]|時[は、]|ただし|なお[、,]|ため[、。]|例[:：]|\b(?:if|when|unless|otherwise)\b/iv;
const SENTENCE_END = /。|[.!?](?=\s|$)/gv;
const CODE_SPAN = /`[^`]*`/gv;

const tsdocLines = (comment) =>
  comment.value
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/v, "").trim())
    .filter((line) => line !== "");

const tagText = (line) => {
  const [tag = "", ...rest] = line.split(/\s+/v);
  const words = tag === "@param" ? rest.slice(1) : rest;

  return { tag, text: words.join(" ") };
};

const splitTsdoc = (comment) => {
  const lines = tsdocLines(comment);
  const firstTag = lines.findIndex((line) => line.startsWith("@"));
  const descriptionEnd = firstTag === -1 ? lines.length : firstTag;
  const tags = [];

  for (const line of lines.slice(descriptionEnd)) {
    if (line.startsWith("@")) {
      tags.push({ ...tagText(line), lineCount: 1 });
    } else if (tags.length > 0) {
      tags.at(-1).lineCount += 1;
    }
  }

  return { description: lines.slice(0, descriptionEnd), tags };
};

const wordingProblems = ({ maxLength, text }) => {
  const problems = [];

  if (text.length > maxLength) {
    problems.push("tooLong");
  }

  if ((text.match(SENTENCE_END) ?? []).length > 1) {
    problems.push("multipleSentences");
  }

  if (BEHAVIOR.test(text.replaceAll(CODE_SPAN, ""))) {
    problems.push("behavior");
  }

  return problems;
};

const tsdocRoleOnly = {
  meta: {
    type: "problem",
    docs: {
      description:
        "TSDoc には役割と定義だけを1文で書かせ、仕様や振る舞いの説明を禁止する。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          maxLength: {
            type: "integer",
            minimum: 1,
          },
        },
      },
    ],
    messages: {
      tag: "TSDoc に {{tag}} は書きません。使えるタグは @param・@returns・@deprecated だけです。振る舞いはテストで表します。",
      multiLine:
        "TSDoc の説明とタグは、それぞれ1行に収めます。役割と定義だけを書き、仕様や振る舞いはテストで表します。",
      multipleSentences:
        "TSDoc の説明とタグは、それぞれ1文にします。役割と定義だけを書き、仕様や振る舞いはテストで表します。",
      tooLong:
        "TSDoc の説明とタグは、それぞれ {{max}} 文字までです。役割と定義だけを書き、仕様や振る舞いはテストで表します。",
      behavior:
        "TSDoc に条件・例・補足・理由を書かないでください。振る舞いはテストで表し、理由は一番近い DECISIONS.md に書きます。",
    },
  },
  /** ファイルごとに、TSDoc の説明とタグを調べる。 */
  create(context) {
    const maxLength = context.options[0]?.maxLength ?? DEFAULT_MAX_LENGTH;

    return {
      "Program:exit"() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (!isTsdoc(comment)) {
            continue;
          }

          const { description, tags } = splitTsdoc(comment);
          const report = (messageId, data) => {
            context.report({ loc: comment.loc, messageId, data });
          };

          const max = String(maxLength);

          if (description.length > 1 || tags.some((tag) => tag.lineCount > 1)) {
            report("multiLine");
          }

          for (const tag of tags) {
            if (!ALLOWED_TAGS.has(tag.tag)) {
              report("tag", { tag: tag.tag });
            }
          }

          for (const text of [
            description.join(" "),
            ...tags.map((tag) => tag.text),
          ]) {
            for (const problem of wordingProblems({ maxLength, text })) {
              report(problem, { max });
            }
          }
        }
      },
    };
  },
};

export default tsdocRoleOnly;
