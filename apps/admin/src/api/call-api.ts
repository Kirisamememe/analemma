import { type ClientPromiseResult, type ORPCError, safe } from "@orpc/client";

type ApiResult<Data, Code extends string> =
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
      readonly code: Code;
    };

/** API の応答から、成功と呼び出し側で扱う失敗を取り出す。 */
export const callApi = async <
  Data,
  ContractCode extends string,
  const Code extends ContractCode,
>(
  request: ClientPromiseResult<Data, ORPCError<ContractCode, unknown> | Error>,
  handledCodes: readonly Code[],
): Promise<ApiResult<Data, Code>> => {
  const result = await safe(request);

  if (result.isSuccess) {
    return { _tag: "Succeeded", data: result.data };
  }

  if (result.isDefined) {
    const code = handledCodes.find((handled) => handled === result.error.code);

    if (code !== undefined) {
      return { _tag: "Failed", code };
    }
  }

  throw result.error;
};
