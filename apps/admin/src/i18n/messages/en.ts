/** 英語の訳で、ほかの言語のキーと引数の出どころ。 */
export const en = {
  "app.name": "Stilus",
  "home.title": "Stilus",
  "notFound.title": "Page not found",
  "notFound.description": "There is no page at {path}.",
  "notFound.backHome": "Back to home",
  "ui.pending": "Working",
  "login.title": "Sign in to Stilus",
  "login.description": "Use a passkey you registered for this admin.",
  "login.submit": "Sign in with a passkey",
  "login.cancelled": "Sign-in was cancelled.",
  "login.expired": "It took too long. Please sign in again.",
  "login.unknownPasskey":
    "This passkey is not registered. It may have been deleted.",
  "login.rejected": "The passkey could not be verified.",
  "login.failed": "Could not sign in. Please try again later.",
  "enroll.title": "Register a passkey",
  "enroll.description": "Create a passkey to sign in to this admin.",
  "enroll.name": "Passkey name",
  "enroll.nameDescription":
    "A name to tell your passkeys apart, such as the device.",
  "enroll.submit": "Register the passkey",
  "enroll.missingToken":
    "This registration URL is incomplete. Issue a new one with the server command.",
  "enroll.cancelled": "Registration was cancelled.",
  "enroll.invalid":
    "This registration URL can no longer be used. It may have expired or been used. Issue a new one with the server command.",
  "enroll.expired": "It took too long. Please register again.",
  "enroll.alreadyRegistered":
    "This authenticator already has a passkey for this admin. Sign in with it.",
  "enroll.rejected": "The passkey could not be registered.",
  "enroll.failed": "Could not register. Please try again later.",
  "enroll.signIn": "Go to sign-in",
  "session.logOut": "Sign out",
  "session.logOutFailed": "Could not sign out. Please try again.",
} as const satisfies Readonly<Record<string, string>>;
