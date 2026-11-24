/** Dropbox の API の失敗のうち、token が使えなくなったこと(利用者がアプリの接続を切ったなど)。 */
export type DropboxUnauthorized = {
  /** どの結果か。 */
  readonly _tag: "Unauthorized";
};

/** 認可の画面を開く URL と、戻ってきたときに照らす state。 */
export type DropboxAuthorization = {
  /** 認可の画面の URL。 */
  readonly url: string;
  /** 戻ってきたときに照らす state。 */
  readonly state: string;
};

/** code を token に換えた結果。 */
export type DropboxExchange =
  | {
      /** どの結果か。 */
      readonly _tag: "Authorized";
      /** 期限の無い refresh token。 */
      readonly refreshToken: string;
      /** 短い期限の access token。 */
      readonly accessToken: string;
      /** access token が切れるまでの秒数。 */
      readonly expiresInSeconds: number;
    }
  | {
      /** Dropbox が code を断った(期限切れ・使用済み・別の redirect URI など)。 */
      readonly _tag: "Rejected";
    };

/** refresh token で access token を作り直した結果。 */
export type DropboxRefresh =
  | {
      /** どの結果か。 */
      readonly _tag: "Refreshed";
      /** 短い期限の access token。 */
      readonly accessToken: string;
      /** access token が切れるまでの秒数。 */
      readonly expiresInSeconds: number;
    }
  | {
      /** refresh token が取り消されている。 */
      readonly _tag: "Revoked";
    };

/** つないだアカウント。 */
export type DropboxAccount = {
  /** どの結果か。 */
  readonly _tag: "Account";
  /** アカウントの ID。 */
  readonly accountId: string;
  /** 表示名。 */
  readonly name: string;
  /** メールアドレス。 */
  readonly email: string;
};

/** App folder にあるファイル。 */
export type DropboxFile = {
  /** ファイルの ID(id: で始まる)。 */
  readonly id: string;
  /** App folder の中のパス(Dropbox に見える大文字と小文字)。 */
  readonly path: string;
  /** 大きさ(bytes)。 */
  readonly size: number;
  /** Dropbox でファイルが最後に変わった日時。 */
  readonly modifiedAt: Date;
  /** Dropbox の content_hash。 */
  readonly contentHash: string;
};

/** ファイルを読んだ結果。 */
export type DropboxDownload =
  | {
      /** どの結果か。 */
      readonly _tag: "Downloaded";
      /** 読んだときのファイル。 */
      readonly file: DropboxFile;
      /** ファイルの中身。 */
      readonly bytes: Uint8Array;
    }
  | {
      /** ファイルが無い。 */
      readonly _tag: "NotFound";
    }
  | {
      /** 上限より大きい。 */
      readonly _tag: "TooLarge";
    }
  | {
      /** 読む前に、呼んだ側が断った。 */
      readonly _tag: "Declined";
      /** 読もうとしたときのファイル。 */
      readonly file: DropboxFile;
    }
  | DropboxUnauthorized;

/** 認可の画面から戻った code と、認可の画面に渡した redirect URI。 */
export type DropboxCode = {
  /** 戻った code。 */
  readonly code: string;
  /** 認可の画面に渡した redirect URI。 */
  readonly redirectUri: string;
};

/** ID で読むファイルと、大きさの上限。 */
export type DropboxFileRequest = {
  /** ファイルの ID。 */
  readonly fileId: string;
  /** 読む大きさの上限(bytes)。 */
  readonly maxBytes: number;
  /** 本文を読む前に、ファイルを読むかを決める関数。 */
  readonly accept?: (file: DropboxFile) => boolean;
};

/** App folder のファイルの一覧。 */
export type DropboxListing = {
  /** どの結果か。 */
  readonly _tag: "Listed";
  /** ダウンロードできるファイル。 */
  readonly files: readonly DropboxFile[];
};

/** 1つのアプリとして Dropbox の API を呼ぶ client。 */
export type DropboxApi = {
  /** 認可の画面を開く URL を、新しい state で作る。 */
  readonly authorize: (redirectUri: string) => DropboxAuthorization;
  /** 認可の画面から戻った code を、token に換える。 */
  readonly exchangeCode: (
    input: DropboxCode,
    signal?: AbortSignal,
  ) => Promise<DropboxExchange>;
  /** refresh token で access token を作り直す。 */
  readonly refresh: (
    refreshToken: string,
    signal?: AbortSignal,
  ) => Promise<DropboxRefresh>;
  /** access token と、同じ認可の refresh token を取り消す。 */
  readonly revoke: (accessToken: string, signal?: AbortSignal) => Promise<void>;
  /** つないだアカウントを読む。 */
  readonly getAccount: (
    accessToken: string,
    signal?: AbortSignal,
  ) => Promise<DropboxAccount | DropboxUnauthorized>;
  /** App folder の下のファイルを、下のフォルダまですべて読む。 */
  readonly listFiles: (
    accessToken: string,
    signal?: AbortSignal,
  ) => Promise<DropboxListing | DropboxUnauthorized>;
  /** ファイルを ID で、上限の大きさまで読む。 */
  readonly download: (
    accessToken: string,
    request: DropboxFileRequest,
  ) => Promise<DropboxDownload>;
};
