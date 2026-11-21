const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/v;

/** テストのファイルを見分ける。 */
export const isTestFile = (filename) => TEST_FILE.test(filename);
