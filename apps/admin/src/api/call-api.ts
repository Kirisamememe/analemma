import { type ClientPromiseResult, type ORPCError, safe } from "@orpc/client";

type DefinedFailure = ORPCError<string, unknown>;
type ApiResult<Data, Failure extends DefinedFailure> =
  | {
      /** どの結果か。 */
      readonly _tag: "Succeeded";
      /** contract の出力。 */
      readonly data: Data;
    }
  | {
      /** どの結果か。 */
      readonly _tag: "Failed";
      /** 呼び出し側で扱う失敗の code。 */
      readonly code: Failure["code"];
      /** code に対応するデータを持つ失敗。 */
      readonly error: Failure;
    };

const isHandled = <Failure extends DefinedFailure, Code extends string>(
  failure: Failure,
  codes: readonly Code[],
): failure is Extract<Failure, Record<"code", Code>> =>
  codes.some((code) => code === failure.code);

/** API の応答から、成功と呼び出し側で扱う失敗を取り出す。 */
export const callApi = async <
  Data,
  Failure extends DefinedFailure,
  const Code extends NoInfer<Failure["code"]>,
>(
  request: ClientPromiseResult<Data, Failure | Error>,
  handledCodes: readonly Code[],
): Promise<ApiResult<Data, Extract<Failure, Record<"code", Code>>>> => {
  const result = await safe(request);

  if (result.isSuccess) return { _tag: "Succeeded", data: result.data };

  if (
    result.isDefined &&
    isHandled<Failure, Code>(result.error, handledCodes)
  ) {
    return { _tag: "Failed", code: result.error.code, error: result.error };
  }

  const unhandled: Error = result.error;
  throw unhandled;
};
