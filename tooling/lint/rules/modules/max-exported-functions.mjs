import { collectExportedFunctions } from "./exported-functions.mjs";

const DEFAULT_MAX_EXPORTED_FUNCTIONS = 2;

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
        },
      },
    ],
    messages: {
      tooMany:
        "このファイルは関数を {{count}} 個 export しています。export できる関数は {{max}} 個までです。型の export は数えません。",
    },
  },
  /** ファイルごとに、export した関数を数える。 */
  create(context) {
    if (!/\.(?:[cm]?ts|tsx)$/v.test(context.filename)) {
      return {};
    }

    const max = context.options[0]?.max ?? DEFAULT_MAX_EXPORTED_FUNCTIONS;

    return {
      "Program:exit"(program) {
        const exported = collectExportedFunctions(program);

        if (exported.size > max) {
          context.report({
            node: program,
            messageId: "tooMany",
            data: {
              count: String(exported.size),
              max: String(max),
            },
          });
        }
      },
    };
  },
};

export default maxExportedFunctions;
