import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import {
  SAMPLE_IMAGES as IMAGES,
  type SamplePhotoName,
  samplePhoto,
} from "@/testing/sample-photos";

const MANY: readonly FakeImageSeed[] = Array.from(
  { length: 8 },
  () => IMAGES,
).flat();

const meta = {
  title: "screens/Images",
  component: AppPreview,
  args: {
    path: "/images",
    /** 画像が12枚ある server。 */
    createRoutes: (): FakeRoutes => createImageRoutes(IMAGES).routes,
  },
  argTypes: {
    path: { control: false },
    createRoutes: { control: false },
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

const withServer = (createRoutes: () => FakeRoutes): Story => ({
  args: { createRoutes },
});

export const SeveralImages: Story = {};
export const ManyImages = withServer(() => createImageRoutes(MANY).routes);
export const Empty = withServer(() => createImageRoutes([]).routes);

export const Loading = withServer(() => ({
  ...createImageRoutes(IMAGES).routes,
  "admin/images/list": async () =>
    Promise.withResolvers<FakeReply<"admin/images/list">>().promise,
}));

const failed = () =>
  ({ error: "INTERNAL_SERVER_ERROR", defined: false }) as const;

export const LoadFailed = withServer(() => ({
  ...createImageRoutes(IMAGES).routes,
  "admin/images/list": failed,
}));

export const MoreFailed = withServer(() => {
  const { routes } = createImageRoutes(MANY);

  return {
    ...routes,
    "admin/images/list": (input) =>
      input.cursor === undefined
        ? routes["admin/images/list"](input)
        : failed(),
  };
});

export const Uploading = withServer(() => {
  const { routes } = createImageRoutes(IMAGES, {
    deliveryImages: samplePhoto("blossom"),
  });

  return {
    ...routes,
    "admin/images/upload": async (input) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });

      return input.photo.name.includes("fail")
        ? failed()
        : routes["admin/images/upload"](input);
    },
  };
});

const UPLOAD_SAMPLES: readonly SamplePhotoName[] = [
  "dusk-ridge",
  "morning-lake",
  "sea-mist",
  "dunes",
  "night-harbor",
];

const sampleFile = async (name: SamplePhotoName): Promise<File> => {
  const image = new Image();
  image.src = `/media/samples/${name}.svg`;
  await image.decode();

  const canvas = document.createElement("canvas");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");

  if (context === null) throw new Error("写真を描けません");

  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg");
  });

  if (blob === null) throw new Error("写真を JPEG にできません");

  return new File([blob], `${name}.jpg`, { type: blob.type });
};

type UploadExample = {
  /** 転送中にしておく写真。 */
  pending?: readonly SamplePhotoName[];
  /** 初回の送信が失敗する写真。 */
  failures?: readonly SamplePhotoName[];
};

const uploadStory = ({
  pending = [],
  failures = [],
}: UploadExample = {}): Story => ({
  args: {
    ...(pending.length > 0 && {
      uploadProgress: (report) => {
        report(0.64);
      },
    }),
    /** 選んだ写真と同じ配信用の画像を、一覧と詳細にも返す。 */
    createRoutes: () => {
      const failOnce = new Set(failures);
      const uploaded: FakeImageSeed = {};
      const { routes } = createImageRoutes(IMAGES, uploaded);

      return {
        ...routes,
        "admin/images/upload": (input) => {
          const name = UPLOAD_SAMPLES.find(
            (sample) => input.photo.name === `${sample}.jpg`,
          );

          if (name !== undefined && failOnce.delete(name)) return failed();

          if (name !== undefined && pending.includes(name)) {
            return Promise.withResolvers<FakeReply<"admin/images/upload">>()
              .promise;
          }

          uploaded.deliveryImages = name === undefined ? [] : samplePhoto(name);

          return routes["admin/images/upload"](input);
        },
      };
    },
  },
  /** 画像一覧に見本の写真をまとめて落とし、指定した枚数がアップロードされるまで待つ。 */
  play: async ({ canvas }) => {
    const main = await canvas.findByRole("main");
    const list = await within(main).findByRole("list", { name: /.+/v });

    const files = await Promise.all(
      UPLOAD_SAMPLES.map((name) => sampleFile(name)),
    );

    const dataTransfer = new DataTransfer();

    for (const file of files) dataTransfer.items.add(file);

    list.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }),
    );

    const completed = pending.length > 0 ? 1 : files.length - failures.length;

    await waitFor(() =>
      expect(list.children).toHaveLength(IMAGES.length + completed),
    );

    const dialog = within(
      await within(list.ownerDocument.body).findByRole("dialog"),
    );

    const selected = pending[0] ?? failures[0];

    if (selected) {
      dialog.getByRole("button", { name: `${selected}.jpg` }).click();
    }

    if (pending.length > 0) {
      await waitFor(() =>
        expect(dialog.getAllByRole("progressbar")).toHaveLength(pending.length),
      );
    } else {
      await waitFor(() =>
        expect(dialog.queryAllByRole("progressbar")).toHaveLength(0),
      );
    }
  },
});

export const DraggingPhotos: Story = {
  /** 画像一覧に写真を重ね、落とす前の案内を表示する。 */
  play: async ({ canvas }) => {
    const main = await canvas.findByRole("main");
    const list = await within(main).findByRole("list", { name: /.+/v });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File(["photo"], "lake.jpg", { type: "image/jpeg" }),
    );
    list.dispatchEvent(
      new DragEvent("dragenter", { bubbles: true, dataTransfer }),
    );
  },
};

export const UploadCarousel = uploadStory();

export const UploadInProgress = uploadStory({
  pending: ["morning-lake", "sea-mist"],
});

export const UploadPartiallyFailed = uploadStory({
  failures: ["morning-lake", "dunes"],
});

export const UploadAllFailed = uploadStory({ failures: UPLOAD_SAMPLES });
