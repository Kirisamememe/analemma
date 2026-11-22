import { countCodeLines } from "../comments/lines.mjs";
import { collectExportedFunctions } from "./exported-functions.mjs";

const DEFAULT_MAX_EXPORTED_FUNCTIONS = 2;
const DEFAULT_LIMITED_AFTER = 0;

const maxExportedFunctions = {
  meta: {
    type: "problem",
    docs: {
      description: "TypeScript ファイルが export する関数の数を制限する。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          max: {
            type: "integer",
            minimum: 0,
          },
          limitedAfter: {
            type: "integer",
            minimum: 0,
          },
        },
      },
    ],
    messages: {
      tooMany:
        "このファイルのコードは {{lines}} 行あり、関数を {{count}} 個 export しています。コードが {{limitedAfter}} 行を超えるファイルが export できる関数は {{max}} 個までです(空行とコメントだけの行と、型の export は数えない)。ファイルを分けます。",
    },
  },
  /** コードの行数が上限を超えるファイルで、export した関数を数える。 */
  create(context) {
    if (!/\.(?:[cm]?ts|tsx)$/v.test(context.filename)) {
      return {};
    }

    const max = context.options[0]?.max ?? DEFAULT_MAX_EXPORTED_FUNCTIONS;
    const limitedAfter =
      context.options[0]?.limitedAfter ?? DEFAULT_LIMITED_AFTER;

    return {
      "Program:exit"(program) {
        const lines = countCodeLines({
          comments: context.sourceCode.getAllComments(),
          text: context.sourceCode.text,
        });
        const exported = collectExportedFunctions(program);

        if (lines > limitedAfter && exported.size > max) {
          context.report({
            node: program,
            messageId: "tooMany",
            data: {
              lines: String(lines),
              count: String(exported.size),
              limitedAfter: String(limitedAfter),
              max: String(max),
            },
          });
        }
      },
    };
  },
};

export default maxExportedFunctions;
