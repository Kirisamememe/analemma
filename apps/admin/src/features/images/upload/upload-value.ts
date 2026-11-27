/** 入力欄または進捗表示が購読する値。 */
export type UploadValue<T> = {
  /** 現在の値を読む。 */
  readonly read: () => T;
  /** 値が変わったときの通知を受け取る。 */
  readonly subscribe: (notify: () => void) => () => void;
};

/** 写真追加の操作と表示部品が共有する値を作る。 */
export const createUploadValue = <T>(initial: T) => {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    read: () => current,
    subscribe: (notify: () => void) => {
      listeners.add(notify);

      return () => listeners.delete(notify);
    },
    set: (next: T) => {
      if (Object.is(current, next)) return;

      current = next;

      for (const notify of listeners) notify();
    },
  };
};
