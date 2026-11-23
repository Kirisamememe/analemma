import type { ApiOutputs } from "@/api/api-types";
import type { FakeImageSeed } from "@/testing/fake-routes/create-image-routes";

type DeliveryImages = ApiOutputs["admin"]["images"]["get"]["deliveryImages"];

const RATIOS = {
  "dusk-ridge": [3, 2],
  "morning-lake": [2, 3],
  "green-hills": [4, 5],
  "night-harbor": [16, 9],
  dunes: [1, 1],
  "sea-mist": [3, 1],
  "snow-path": [1, 3],
  blossom: [4, 3],
} as const;

/** story で描ける、作り物の写真の名前。 */
export type SamplePhotoName = keyof typeof RATIOS;

const LONG_EDGE = 2560;
const STEPS = [640, 1280, 1920];

/** 作り物の写真の、server と同じ段に分けた配信用の画像。 */
export const samplePhoto = (name: SamplePhotoName): DeliveryImages => {
  const [across, down] = RATIOS[name];
  const scale = LONG_EDGE / Math.max(across, down);
  const width = Math.round(across * scale);
  const url = `/media/samples/${name}.svg`; // story だけが、Storybook の静的なファイルから読む

  return [...STEPS.filter((step) => step < width), width].map((step) => ({
    width: step,
    height:
      step === width
        ? Math.round(down * scale)
        : Math.round((step * down) / across),
    url,
  }));
};

const photo = (
  name: SamplePhotoName,
  seed: FakeImageSeed = {},
): FakeImageSeed => ({ ...seed, deliveryImages: samplePhoto(name) });

/** 一覧とビューアの story に置く、12枚の画像(新しく足した順)。 */
export const SAMPLE_IMAGES: readonly FakeImageSeed[] = [
  photo("dusk-ridge", {
    title: "夕暮れの稜線",
    description:
      "五月の連休、峠から西の稜線を見た。陽が落ちる直前の十分ほど、山の重なりが一枚ずつ色を変えていった。",
    alt: "夕日の残る空の下に、山並みが二重に重なる",
    takenAt: "2025-05-01T18:42:07",
    takenAtOffset: "+09:00",
    camera: "FUJIFILM X-T5",
    lens: "XF16-55mmF2.8 R LM WR",
    focalLength: 35,
    fNumber: 8,
    exposureTime: 0.004,
    iso: 200,
  }),
  photo("morning-lake", { takenAt: "2025-04-28T06:10:00" }),
  photo("night-harbor", {
    title: "港の灯り",
    takenAt: "2025-01-03T21:04:00",
    published: false,
  }),
  photo("green-hills", { title: "雪の参道", takenAt: "2025-02-11T09:30:00" }),
  photo("dunes"),
  photo("sea-mist", {
    title: "海霧のパノラマ",
    takenAt: "2024-11-30T07:12:00",
  }),
  photo("blossom", {
    title: "Sakura at Kiyosumi-shirakawa, early morning",
    takenAt: "2024-04-02T05:55:00",
    published: false,
  }),
  { title: "変換を待っている写真", takenAt: "2024-03-18T15:00:00" },
  photo("snow-path", { title: "細い路地", takenAt: "2024-03-17T16:20:00" }),
  photo("dusk-ridge", { title: "残照", takenAt: "2023-12-31T16:41:00" }),
  photo("morning-lake", { title: "川面", takenAt: "2023-12-30T08:00:00" }),
  photo("night-harbor", { takenAt: "2023-12-29T22:15:00" }),
];
