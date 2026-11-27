import { expect, test } from "bun:test";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  createTestClient,
  catchErrorCode,
  signInAsAdmin,
  TEST_ORIGIN,
  TEST_NOW,
} from "@/test-client";

test("公開画像の撮影の情報と、配信用の絶対 URL を幅の昇順で返し、非公開にするか消すと NOT_FOUND になること", async () => {
  await using server = await createTestClient();

  const fields = {
    title: "渚",
    description: null,
    alt: "白い波",
    camera: "X-T5",
    lens: null,
    focalLength: 35,
    fNumber: 4,
    exposureTime: 0.004,
    iso: 160,
  };

  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
  });
  const id = crypto.randomUUID();
  await connection.db.insert(image).values({
    ...fields,
    id,
    status: "published",
    publishedAt: TEST_NOW,
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
    takenAt: "2025-05-01 14:03:27",
    takenAtOffsetMinutes: 540,
  });
  await connection.db.insert(deliveryImage).values(
    [1280, 640].map((width) => ({
      imageId: id,
      width,
      height: width / 2,
      fileKey: `${id}-${width}.avif`,
    })),
  );
  const api = server.internal().public.images;
  expect(await api.get({ id })).toEqual({
    ...fields,
    id,
    takenAt: "2025-05-01T14:03:27",
    takenAtOffset: "+09:00",
    deliveryImages: [
      { width: 640, height: 320, url: `${TEST_ORIGIN}/media/${id}/640.avif` },
      { width: 1280, height: 640, url: `${TEST_ORIGIN}/media/${id}/1280.avif` },
    ],
  });
  await signInAsAdmin(server);
  const images = server.client.admin.images;
  await images.unpublish({ id });
  expect(await catchErrorCode(api.get({ id }))).toBe("NOT_FOUND");
  await images.publish({ id });
  expect((await api.get({ id })).id).toBe(id);
  await images.delete({ id });
  expect(await catchErrorCode(api.get({ id }))).toBe("NOT_FOUND");
});
