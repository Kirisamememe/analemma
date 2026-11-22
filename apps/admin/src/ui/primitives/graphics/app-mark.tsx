import type { ReactNode } from "react";

/** アプリの名前に添えるアナレンマの印。 */
export const AppMark = (): ReactNode => (
  <svg
    aria-hidden="true"
    className="h-6 w-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="1.5"
    viewBox="0 0 16 24"
  >
    <g transform="translate(-1.5 0) rotate(-14 8 12)">
      <path d="M8 9.5C10.6 7.8 10.9 3 8 3C5.1 3 5.4 7.8 8 9.5Z" />
      <path d="M8 9.5C11.6 11.6 12.4 21 8 21C3.6 21 4.4 11.6 8 9.5Z" />
      <circle cx="11" cy="16" r="1.75" fill="currentColor" stroke="none" />
    </g>
  </svg>
);
