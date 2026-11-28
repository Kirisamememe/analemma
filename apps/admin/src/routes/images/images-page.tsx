import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useImageListPosition } from "./use-image-list-position";

import { ImagesSection } from "@/components/images/images-section";
import { PhotoUploads } from "@/features/images/upload/photo-uploads";
import { Center, Stack } from "@/ui/layout";

/** 画像を、写真の縦横比を保って並べる画面。 */
export const ImagesPage = (): ReactNode => {
  const restorePosition = useImageListPosition();
  const router = useRouter();

  const imageHref = (id: string): string =>
    router.buildLocation({ to: "/images/$id", params: { id } }).href;

  return (
    <Center width="page">
      <Stack gap={8}>
        <PhotoUploads imageHref={imageHref} />
        <div ref={restorePosition}>
          <ImagesSection imageHref={imageHref} />
        </div>
      </Stack>
    </Center>
  );
};
