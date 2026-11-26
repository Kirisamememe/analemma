import { implement } from "@orpc/server";

import { contract } from "@analemma/contract";

import type { RequestContext } from "@/context";
import {
  getReauthenticationOptions,
  getSession,
  logOut,
  logOutAllSessions,
} from "@/features/auth/current-session";
import {
  enrollPasskey,
  getEnrollmentOptions,
} from "@/features/auth/enrollment";
import { getLoginOptions, logIn } from "@/features/auth/login";
import {
  addPasskey,
  deletePasskey,
  getPasskeyOptions,
  listPasskeys,
  renamePasskey,
} from "@/features/auth/passkeys";
import {
  getPublishedCollection,
  listPublishedCollections,
  getCollection,
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  publishCollection,
  unpublishCollection,
  addCollectionImages,
  removeCollectionImages,
  reorderCollectionImages,
} from "@/features/collections";
import {
  issueDeployToken,
  listDeployTokens,
  revokeDeployToken,
} from "@/features/deploy-tokens";
import {
  authorizeDropbox,
  connectDropbox,
  disconnectDropbox,
  getDropboxConnection,
  getDropboxImport,
  listDropboxPhotos,
  startDropboxImport,
} from "@/features/dropbox";
import {
  createFixedPage,
  deleteFixedPage,
  updateFixedPage,
  getFixedPage,
  listFixedPages,
  reorderFixedPages,
  getPublishedFixedPage,
  listPublishedFixedPages,
  publishFixedPage,
  unpublishFixedPage,
} from "@/features/fixed-pages";
import { getHealth } from "@/features/health/get-health";
import {
  deleteImage,
  getPublishedImage,
  getImage,
  getImageNeighbors,
  listImages,
  publishImage,
  unpublishImage,
  updateImage,
  uploadImage,
} from "@/features/images";
import { getKind, listKinds, pushKinds } from "@/features/kinds";
import {
  adminProcedures,
  authProcedures,
  deployProcedures,
} from "@/procedures";

/** 全 feature の procedure を束ねたルーター。 */
export const router = implement(contract)
  .$context<RequestContext>()
  .router({
    admin: adminProcedures.router({
      collections: {
        get: getCollection,
        list: listCollections,
        create: createCollection,
        update: updateCollection,
        delete: deleteCollection,
        publish: publishCollection,
        unpublish: unpublishCollection,
        addImages: addCollectionImages,
        removeImages: removeCollectionImages,
        reorder: reorderCollectionImages,
      },
      deployTokens: {
        list: listDeployTokens,
        issue: issueDeployToken,
        revoke: revokeDeployToken,
      },
      dropbox: {
        get: getDropboxConnection,
        authorize: authorizeDropbox,
        connect: connectDropbox,
        disconnect: disconnectDropbox,
        photos: listDropboxPhotos,
        startImport: startDropboxImport,
        getImport: getDropboxImport,
      },
      fixedPages: {
        list: listFixedPages,
        get: getFixedPage,
        create: createFixedPage,
        update: updateFixedPage,
        publish: publishFixedPage,
        unpublish: unpublishFixedPage,
        reorder: reorderFixedPages,
        delete: deleteFixedPage,
      },
      images: {
        list: listImages,
        get: getImage,
        upload: uploadImage,
        neighbors: getImageNeighbors,
        update: updateImage,
        publish: publishImage,
        unpublish: unpublishImage,
        delete: deleteImage,
      },
      kinds: { list: listKinds, get: getKind },
      passkeys: {
        list: listPasskeys,
        registrationOptions: getPasskeyOptions,
        register: addPasskey,
        rename: renamePasskey,
        delete: deletePasskey,
      },
      session: {
        get: getSession,
        reauthenticationOptions: getReauthenticationOptions,
        logOut,
        logOutAll: logOutAllSessions,
      },
    }),
    auth: authProcedures.router({
      enrollment: { options: getEnrollmentOptions, register: enrollPasskey },
      login: { options: getLoginOptions, verify: logIn },
    }),
    deploy: deployProcedures.router({ kinds: { push: pushKinds } }),
    public: {
      collections: {
        get: getPublishedCollection,
        list: listPublishedCollections,
      },
      fixedPages: {
        list: listPublishedFixedPages,
        get: getPublishedFixedPage,
      },
      health: { get: getHealth },
      images: { get: getPublishedImage },
    },
  });
