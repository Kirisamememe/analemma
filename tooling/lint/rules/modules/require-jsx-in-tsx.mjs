const requireJsxInTsx = {
  meta: {
    type: "problem",
    docs: {
      description: "JSX の要素も fragment も含まない .tsx のファイルを止める。",
    },
    schema: [],
    messages: {
      missingJsx:
        "JSX を含まないファイルは `.ts` にします。`.tsx` にするのは、JSX の要素か fragment を書くファイルだけです。",
    },
  },
  /** .tsx のファイルに、JSX の要素か fragment があるかを調べる。 */
  create(context) {
    if (!context.filename.endsWith(".tsx")) {
      return {};
    }

    let hasJsx = false;

    const onJsx = () => {
      hasJsx = true;
    };

    return {
      JSXElement: onJsx,
      JSXFragment: onJsx,
      "Program:exit"(program) {
        if (!hasJsx) {
          context.report({ node: program, messageId: "missingJsx" });
        }
      },
    };
  },
};

export default requireJsxInTsx;
