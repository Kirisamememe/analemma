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

/** 認可の画面から戻った code と、認可の画面に渡した redirect URI。 */
export type DropboxCode = {
  /** 戻った code。 */
  readonly code: string;
  /** 認可の画面に渡した redirect URI。 */
  readonly redirectUri: string;
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
  /** access token と、同じ認可の refresh token を取り消せたかを返す。 */
  readonly revoke: (
    accessToken: string,
    signal?: AbortSignal,
  ) => Promise<boolean>;
  /** つないだアカウントを読む。 */
  readonly getAccount: (
    accessToken: string,
    signal?: AbortSignal,
  ) => Promise<DropboxAccount | DropboxUnauthorized>;
};
