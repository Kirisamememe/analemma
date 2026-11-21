import { countCodeLines } from "../comments/lines.mjs";

const DEFAULT_MAX = 800;

const fileLengthLimit = {
  meta: {
    type: "problem",
    docs: {
      description:
        "ファイルのコードの行数(空行とコメントだけの行を除く)に上限を設ける。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          max: {
            type: "integer",
            minimum: 1,
          },
        },
      },
    ],
    messages: {
      tooLong:
        "このファイルのコードは {{lines}} 行あり、{{max}} 行を超えています(空行とコメントだけの行は数えない)。ファイルを分けます。401〜800行に限り、分けられない理由があれば、1行目に `// oxlint-disable project/max-code-lines -- 理由` を書けます。800行は越えられません。",
    },
  },
  /** ファイルごとに、コードの行数を数える。 */
  create(context) {
    const max = context.options[0]?.max ?? DEFAULT_MAX;

    return {
      "Program:exit"(program) {
        const lines = countCodeLines({
          comments: context.sourceCode.getAllComments(),
          text: context.sourceCode.text,
        });

        if (lines > max) {
          context.report({
            node: program,
            messageId: "tooLong",
            data: { lines: String(lines), max: String(max) },
          });
        }
      },
    };
  },
};

export default fileLengthLimit;
