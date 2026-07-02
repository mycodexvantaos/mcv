import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10 20.5c.2-.2.3-.4.4-.6.2-.4.3-.8.4-1.2.2-1.2.3-2.4.2-3.7-.1-1.3-.4-2.6-1-3.8-.6-1.2-1.5-2.3-2.6-3.1-1.1-.8-2.3-1.4-3.6-1.8" />
      <path d="M14 20.5c-.2-.2-.3-.4-.4-.6-.2-.4-.3-.8-.4-1.2-.2-1.2-.3-2.4-.2-3.7.1-1.3.4-2.6 1-3.8.6-1.2 1.5-2.3 2.6-3.1 1.1-.8 2.3-1.4 3.6-1.8" />
      <path d="M12 18a1.92 1.92 0 0 0-1.4-1.4" />
      <path d="M12 18a1.92 1.92 0 0 1 1.4-1.4" />
      <path d="M12 12a1.92 1.92 0 0 0-1.4-1.4" />
      <path d="M12 12a1.92 1.92 0 0 1 1.4-1.4" />
      <path d="m3 9 2-2" />
      <path d="m19 9 2-2" />
      <path d="M7 16c.4-.2.8-.3 1.2-.4 1.2-.2 2.4-.3 3.7-.2 1.3.1 2.6.4 3.8 1 .9.5 1.7 1.1 2.3 1.8" />
      <path d="M4 14c-.2.2-.4.3-.6.4-.4.2-.8.3-1.2.4" />
    </svg>
  );
}
