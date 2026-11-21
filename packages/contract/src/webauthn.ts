import { z } from "zod";

const base64url = (max: number): z.ZodBase64URL =>
  z.base64url().min(1).max(max);

/** パスキーに付ける名前。 */
export const passkeyName = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^\P{Cc}*$/v, { error: "制御文字は使えない" })
  .describe("管理画面で見分けるための、パスキーの名前。");

/** 登録の options に並べた、すでにある資格情報。 */
const credentialDescriptor = z.object({
  type: z.literal("public-key"),
  id: z.base64url().describe("資格情報の ID の base64url。"),
  transports: z.array(z.string()).describe("認証器との通信の手段。"),
});

/** ブラウザに渡す、パスキーの登録の options。 */
export const registrationOptions = z.object({
  challenge: z.base64url().describe("server が出した challenge の base64url。"),
  rp: z.object({
    id: z.string().describe("RP ID。"),
    name: z.string().describe("パスワードマネージャーに出るサイトの名前。"),
  }),
  user: z.object({
    id: z.base64url().describe("管理者の user handle の base64url。"),
    name: z.string().describe("パスワードマネージャーに出る名前。"),
    displayName: z.string().describe("画面に出す名前。"),
  }),
  pubKeyCredParams: z.array(
    z.object({
      type: z.literal("public-key"),
      alg: z.number().int().describe("COSE のアルゴリズムの番号。"),
    }),
  ),
  excludeCredentials: z
    .array(credentialDescriptor)
    .describe("同じ認証器に2つめを作らせないための、登録済みの資格情報。"),
  authenticatorSelection: z.object({
    residentKey: z.literal("required"),
    requireResidentKey: z.literal(true),
    userVerification: z.literal("required"),
  }),
  attestation: z.literal("none"),
  timeout: z.number().int().positive().describe("待つ時間のミリ秒。"),
});

/** ブラウザに渡す、パスキーでのログインの options。 */
export const authenticationOptions = z.object({
  challenge: z.base64url().describe("server が出した challenge の base64url。"),
  rpId: z.string().describe("RP ID。"),
  allowCredentials: z
    .array(credentialDescriptor)
    .max(0)
    .describe("空にして、認証器に選ばせる。"),
  userVerification: z.literal("required"),
  timeout: z.number().int().positive().describe("待つ時間のミリ秒。"),
});

/** `PublicKeyCredential.toJSON()` が返す、登録の資格情報。 */
export const registrationCredential = z.object({
  id: base64url(1366).describe("資格情報の ID の base64url。"),
  type: z.literal("public-key"),
  response: z.object({
    clientDataJSON: base64url(8192),
    attestationObject: base64url(65_536),
    transports: z
      .array(z.string().max(32))
      .max(16)
      .describe("認証器との通信の手段。"),
  }),
});

/** `PublicKeyCredential.toJSON()` が返す、ログインの資格情報。 */
export const authenticationCredential = z.object({
  id: base64url(1366).describe("資格情報の ID の base64url。"),
  type: z.literal("public-key"),
  response: z.object({
    clientDataJSON: base64url(8192),
    authenticatorData: base64url(8192),
    signature: base64url(2048),
    userHandle: base64url(86).describe("管理者の user handle の base64url。"),
  }),
});

/** 再認証で、今のパスキーが返したログインの資格情報。 */
export const reauthenticationAssertion = authenticationCredential.describe(
  "今のパスキーで確かめ直した、ログインの資格情報。",
);
