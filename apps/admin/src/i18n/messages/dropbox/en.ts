/** Dropbox からの取り込みの、英語の訳。 */
export const dropboxEn = {
  "dropbox.entry": "Import from Dropbox",
  "dropbox.title": "Import from Dropbox",
  "dropbox.description":
    "Create images from photos you put in the Dropbox App folder. Imported photos appear at the top of the image list.",
  "dropbox.loadFailed": "Could not load the Dropbox connection",
  "dropbox.unconfigured":
    "The server has no Dropbox app settings (DROPBOX_APP_KEY and DROPBOX_APP_SECRET). Set them and restart the server.",
  "dropbox.disconnectedTitle": "Not connected to Dropbox",
  "dropbox.disconnectedDescription":
    "Once connected, Analemma reads only this site’s folder inside the Dropbox Apps folder.",
  "dropbox.connect": "Connect to Dropbox",
  "dropbox.account": "Connected account",
  "dropbox.accountDetail": "{{email}} · connected {{date}}",
  "dropbox.disconnect": "Disconnect",
  "dropbox.connectionFailure.NotConfigured":
    "The server has no Dropbox app settings, so Analemma cannot connect.",
  "dropbox.connectionFailure.AlreadyConnected":
    "Already connected to Dropbox. The connection has been reloaded.",
  "dropbox.connectionFailure.ImportRunning":
    "Cannot disconnect while photos are being imported. Try again when the import finishes.",
  "dropbox.connectionFailure.Failed": "Could not reach Dropbox. Try again.",
  "dropbox.connectionLost":
    "The connection to Dropbox was lost. The app may have been disconnected in the Dropbox settings.",
  "dropbox.reconnect": "Connect again",
  "dropbox.photosTitle": "Photos in the App folder",
  "dropbox.photosLoadFailed": "Could not load photos from Dropbox",
  "dropbox.photosEmptyTitle": "No photos in the App folder",
  "dropbox.photosEmptyDescription":
    "Put JPEG, PNG, WebP, AVIF, or HEIC photos in this site’s folder inside the Dropbox Apps folder.",
  "dropbox.photosSummary": "{{importable}} new · {{imported}} imported",
  "dropbox.reload": "Reload",
  "dropbox.import": "Import new photos ({{count}})",
  "dropbox.importNone": "No new photos",
  "dropbox.importing": "Importing",
  "dropbox.progress": "Imported {{done}} of {{total}} photos",
  "dropbox.done": "Added {{added}} of {{total}} photos.",
  "dropbox.doneWithFailures":
    "Added {{added}} of {{total}} photos. {{failed}} could not be imported.",
  "dropbox.startFailure.NotConnected":
    "Not connected to Dropbox. Connect first.",
  "dropbox.startFailure.ConnectionLost":
    "The connection to Dropbox was lost. Connect again.",
  "dropbox.startFailure.ImportRunning": "Another import is already running.",
  "dropbox.photoDetail": "{{size}} · {{date}}",
  "dropbox.status.new": "New",
  "dropbox.status.imported": "Imported",
  "dropbox.status.image-deleted": "Imported (image deleted)",
  "dropbox.status.waiting": "Waiting",
  "dropbox.status.importing": "Importing",
  "dropbox.status.added": "Added",
  "dropbox.status.already-added": "Already imported",
  "dropbox.status.not-found": "Not in Dropbox",
  "dropbox.status.changed": "Changed after you chose it",
  "dropbox.status.too-large": "Too large ({{limit}} MB max)",
  "dropbox.status.unsupported": "Unsupported format",
  "dropbox.status.failed": "Could not import",
  "dropbox.return.NotConfigured":
    "The server has no Dropbox app settings, so Analemma could not connect.",
  "dropbox.return.AlreadyConnected": "Already connected to Dropbox.",
  "dropbox.return.Expired":
    "Could not connect to Dropbox. The authorization took too long or was started in another tab.",
  "dropbox.return.Rejected":
    "Dropbox refused the authorization. Connect again from the import page.",
  "dropbox.return.Denied":
    "You declined in Dropbox, so Analemma is not connected.",
  "dropbox.return.Invalid":
    "This page needs the result from Dropbox. Start connecting from the import page.",
  "dropbox.return.Failed": "Could not connect to Dropbox. Try again later.",
  "dropbox.returnReady":
    "You allowed access in Dropbox. Connect to finish, then return to the import page.",
  "dropbox.returnConnect": "Connect",
  "dropbox.returnBack": "Back to the import page",
} as const;
