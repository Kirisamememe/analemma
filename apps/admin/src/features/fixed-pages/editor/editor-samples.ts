import type { ApiOutputs } from "@/api/api-types";

const date = "2026-01-02T00:00:00.000Z";
export const kind = {
  name: "profile",
  label: "紹介",
  createdAt: date,
  updatedAt: date,
  fields: [],
} satisfies ApiOutputs["admin"]["kinds"]["get"];

export const page = {
  id: "019affff-0000-7000-8000-000000000001",
  kind: kind.name,
  slug: "about",
  title: "紹介",
  content: {},
  published: false,
  publishedAt: null,
  position: 0,
  createdAt: date,
  updatedAt: date,
} satisfies ApiOutputs["admin"]["fixedPages"]["get"];
