import { enrollment } from "./enrollment";
import { health } from "./health";
import { login } from "./login";
import { passkeys } from "./passkeys";
import { session } from "./session";

/** Analemma の API 全体の contract。 */
export const contract = {
  admin: { passkeys, session },
  auth: { enrollment, login },
  public: { health },
};
