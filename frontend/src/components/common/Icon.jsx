import React from 'react';

/**
 * Inline SVG icon set.
 *
 * Line icons on a 24x24 grid, drawn with `currentColor` so an icon inherits the
 * colour of whatever text it sits next to. Kept as inline SVG rather than an
 * icon package so there is no extra dependency and nothing to load at runtime.
 *
 *   <Icon name="users" />
 *   <Icon name="check" size={14} />
 *   <Icon name="target" style={{ color: '#2E5FA3' }} />
 */
const PATHS = {
  // Brand
  logo: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 13h3M8 16.5h6" />
    </>
  ),

  // Navigation
  arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  chevronRight: <path d="M9 18l6-6-6-6" />,

  // Actions
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  check: <path d="M20 6L9 17l-5-5" />,
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v7M14 10v7" />,
  edit: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />,
  save: (
    <>
      <path d="M5 4a1 1 0 0 1 1-1h9.5L20 7.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
      <path d="M8 3v6h7M8 21v-6h8v6" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 3v4h-4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),

  // Status
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.4 2.4 4.6-5" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17.2v.4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.8v.4" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),

  // People
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.1 3.6-6.5 8-6.5s8 2.4 8 6.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20.5c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6" />
      <path d="M16.5 5.2a3.4 3.4 0 0 1 0 5.6M18 14.6c2.2.8 3.5 2.6 3.5 5" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20.5c0-3.6 3-5.6 6.5-5.6 1 0 2 .16 2.8.45" />
      <path d="M18 13v6M15 16h6" />
    </>
  ),
  code: <path d="M8.5 6L2.5 12l6 6M15.5 6l6 6-6 6" />,

  // Objects
  folder: <path d="M3 7a1 1 0 0 1 1-1h5l2 2.5h8a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  clipboard: (
    <>
      <rect x="9" y="3" width="6" height="3.5" rx="1" />
      <path d="M9 4.8H7a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5.8a1 1 0 0 0-1-1h-2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.4l3.4 2" />
    </>
  ),
  flag: <path d="M5 21V4M5 5h12l-2.2 3.6L17 12H5" />,
  link: (
    <>
      <path d="M9.6 14.4a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.2 1.2" />
      <path d="M14.4 9.6a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.2-1.2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9.5" rx="2" />
      <path d="M8.2 11V7.8a3.8 3.8 0 0 1 7.6 0V11" />
    </>
  ),
  shield: <path d="M12 3l7.5 3v6c0 4.6-3.2 7.8-7.5 9-4.3-1.2-7.5-4.4-7.5-9V6z" />,
  shieldCheck: (
    <>
      <path d="M12 3l7.5 3v6c0 4.6-3.2 7.8-7.5 9-4.3-1.2-7.5-4.4-7.5-9V6z" />
      <path d="M9 12.2l2.2 2.2 4-4.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>
  ),
  tool: <path d="M20.5 7.5a4.6 4.6 0 0 1-6.2 4.3l-7.6 7.6a2.3 2.3 0 0 1-3.2-3.2l7.6-7.6a4.6 4.6 0 0 1 6-6.1l-3.1 3.1 2.2 2.2 3.1-3.1c.8.9 1.2 2 1.2 2.8z" />,
  lightbulb: (
    <>
      <path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.9 1 .9 1.7v.4h5v-.4c0-.7.4-1.3.9-1.7A6 6 0 0 0 12 3z" />
      <path d="M9.5 19h5M10.5 21.5h3" />
    </>
  ),

  // Data
  barChart: <path d="M5 20V10M12 20V4M19 20v-6" />,
  trendingUp: <path d="M3 17l6-6 4 4 7-7M17 8h4v4" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15.5" cy="12" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  cpu: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 2v2.5M15 2v2.5M9 19.5V22M15 19.5V22M2 9h2.5M2 15h2.5M19.5 9H22M19.5 15H22" />
    </>
  ),
  zap: <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z" />,
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.6 14.3L7 22l5-2.8 5 2.8-1.6-7.7" />
    </>
  ),
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
};

export default function Icon({
  name,
  size = 16,
  strokeWidth = 1.8,
  style,
  className,
  title,
}) {
  const glyph = PATHS[name];

  if (!glyph) {
    // Unknown name renders nothing rather than throwing, so a typo can never
    // take a whole page down.
    return null;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      className={className}
      style={{ flexShrink: 0, verticalAlign: 'middle', ...style }}
    >
      {title && <title>{title}</title>}
      {glyph}
    </svg>
  );
}
