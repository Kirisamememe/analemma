const DISABLE_DIRECTIVE =
  /^\s*(?:oxlint|eslint)-(?<kind>disable(?:-next-line|-line)?)(?=\s|$)(?<rest>[\s\S]*)$/v;

const isWhitespace = (character) =>
  character !== undefined && /\s/v.test(character);

const findDescriptionStart = (text) => {
  for (let index = 0; index < text.length; index += 1) {
    const next = text[index + 1];

    if (
      text[index] === "-" &&
      (next === "-" || (isWhitespace(text[index - 1]) && isWhitespace(next)))
    ) {
      return index;
    }
  }

  return -1;
};

const parseDirective = (value) => {
  const groups = DISABLE_DIRECTIVE.exec(value)?.groups;

  if (groups === undefined) {
    return undefined;
  }

  const { rest } = groups;
  const descriptionStart = findDescriptionStart(rest);

  const description =
    descriptionStart === -1 ? "" : rest.slice(descriptionStart);

  return {
    kind: groups.kind,
    reason: description.startsWith("--") ? description.slice(2).trim() : "",
    rules: (descriptionStart === -1 ? rest : rest.slice(0, descriptionStart))
      .split(/[\s,]+/v)
      .filter((rule) => rule !== ""),
  };
};

const matchesRule = (token, rule) =>
  token.includes("/") ? token === rule : rule.split("/").at(-1) === token;

const requireDisableReason = {
  meta: {
    type: "problem",
    docs: {
      description:
        "lint の抑制に、ルールの名前と `--` の後の理由を求め、抑制できないルールの抑制を禁止する。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          unsuppressible: {
            type: "array",
            items: { type: "string" },
          },
          topOfFileOnly: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      noRules:
        "抑制するルールの名前を書きます。すべてのルールをまとめて抑制しないでください。",
      noReason:
        "抑制するときは、`--` の後に理由を書きます。ルールに無理があるなら、抑制せずにユーザーに報告します。",
      unsuppressible:
        "{{rule}} は抑制できません。ルールに無理があるなら、ユーザーに報告します。",
      notAtTop:
        "{{rule}} の抑制は、ファイルの1行目に `// oxlint-disable {{rule}} -- 理由` の形で書きます。",
    },
  },
  /** ファイルごとに、lint を抑制するコメントを調べる。 */
  create(context) {
    const options = context.options[0] ?? {};
    const unsuppressible = options.unsuppressible ?? [];
    const topOfFileOnly = options.topOfFileOnly ?? [];

    return {
      "Program:exit"() {
        for (const [index, comment] of context.sourceCode
          .getAllComments()
          .entries()) {
          const directive = parseDirective(comment.value);

          if (directive === undefined) {
            continue;
          }

          const report = (messageId, data) => {
            context.report({ loc: comment.loc, messageId, data });
          };

          const atTop =
            index === 0 &&
            comment.start === 0 &&
            comment.type === "Line" &&
            directive.kind === "disable";

          if (directive.rules.length === 0) {
            report("noRules");
          }

          if (directive.reason === "") {
            report("noReason");
          }

          for (const rule of unsuppressible) {
            if (directive.rules.some((token) => matchesRule(token, rule))) {
              report("unsuppressible", { rule });
            }
          }

          for (const rule of topOfFileOnly) {
            if (
              !atTop &&
              directive.rules.some((token) => matchesRule(token, rule))
            ) {
              report("notAtTop", { rule });
            }
          }
        }
      },
    };
  },
};

export default requireDisableReason;
