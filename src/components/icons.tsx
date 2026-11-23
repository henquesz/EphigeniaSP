import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Marca da Ephigenia: cinco pontos em X. */
export function LogoMark(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" {...props}>
      <g fill="currentColor">
        <circle cx="4" cy="4" r="2.4" />
        <circle cx="16" cy="4" r="2.4" />
        <circle cx="10" cy="10" r="2.4" />
        <circle cx="4" cy="16" r="2.4" />
        <circle cx="16" cy="16" r="2.4" />
      </g>
    </svg>
  );
}

/** Seta ↗ desenhada, para não depender do glifo da fonte. */
export function ArrowUpRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      {...props}
    >
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </svg>
  );
}
