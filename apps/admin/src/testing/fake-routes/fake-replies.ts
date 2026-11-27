/** contract に定義していない、想定外の失敗の応答。 */
export const failedReply = () =>
  ({ error: "INTERNAL_SERVER_ERROR", defined: false }) as const;

/** いつまでも届かない応答。 */
export const pendingReply = async <Reply>(): Promise<Reply> =>
  Promise.withResolvers<Reply>().promise;
