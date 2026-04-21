// Compact line-icons sized for the 40×40 toolbox slot. All 20×20 viewBox,
// 1.5 stroke, no fill unless specifically needed.

const SVG = ({ children, size = 20 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IconHome = () => (
  <SVG><path d="M3 10 L10 3 L17 10 M5 9 V17 H15 V9" /></SVG>
);
export const IconZoom = () => (
  <SVG><circle cx="9" cy="9" r="5" /><path d="M13 13 L17 17 M7 9 H11 M9 7 V11" /></SVG>
);
export const IconCartoon = () => (
  <SVG><path d="M2 10 Q 5 6, 8 10 T 14 10 T 18 10" strokeWidth="2" /></SVG>
);
export const IconSurface = () => (
  <SVG><circle cx="10" cy="10" r="6" /><circle cx="10" cy="10" r="3" /></SVG>
);
export const IconAtoms = () => (
  <SVG>
    <circle cx="6" cy="6" r="2" fill="currentColor" />
    <circle cx="14" cy="6" r="2" fill="currentColor" />
    <circle cx="10" cy="14" r="2" fill="currentColor" />
    <path d="M7.5 7 L 12.5 7 M 7 7.5 L 9 12.5 M 13 7.5 L 11 12.5" />
  </SVG>
);
export const IconPalette = () => (
  <SVG>
    <path d="M10 3 A7 7 0 1 0 10 17 A2 2 0 0 1 10 13 A2 2 0 0 0 10 9 A2 2 0 0 1 10 3 Z" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
    <circle cx="13" cy="7" r="1" fill="currentColor" />
    <circle cx="14" cy="11" r="1" fill="currentColor" />
  </SVG>
);
export const IconHotspot = () => (
  <SVG>
    <circle cx="10" cy="10" r="2" fill="currentColor" />
    <circle cx="10" cy="10" r="5" />
    <path d="M10 3 V5 M10 15 V17 M3 10 H5 M15 10 H17" />
  </SVG>
);
export const IconRuler = () => (
  <SVG>
    <rect x="3" y="8" width="14" height="4" rx="0.5" />
    <path d="M6 8 V10 M9 8 V10 M12 8 V10 M15 8 V10" />
  </SVG>
);
export const IconSelect = () => (
  <SVG>
    <rect x="3" y="3" width="14" height="14" strokeDasharray="3 2" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
  </SVG>
);
export const IconSnapshot = () => (
  <SVG>
    <rect x="3" y="6" width="14" height="10" rx="1" />
    <circle cx="10" cy="11" r="3" />
    <path d="M7 6 V4 H13 V6" />
  </SVG>
);
export const IconFlask = () => (
  <SVG>
    <path d="M8 3 V8 L4 16 A1 1 0 0 0 5 17 H15 A1 1 0 0 0 16 16 L12 8 V3" />
    <path d="M7 3 H13" />
    <path d="M6 13 H14" opacity="0.5" />
  </SVG>
);
export const IconPlay = () => (
  <SVG><polygon points="5,3 17,10 5,17" fill="currentColor" /></SVG>
);
export const IconPause = () => (
  <SVG>
    <rect x="5" y="3" width="4" height="14" fill="currentColor" />
    <rect x="11" y="3" width="4" height="14" fill="currentColor" />
  </SVG>
);
export const IconExit = () => (
  <SVG>
    <path d="M13 3 H15 A2 2 0 0 1 17 5 V15 A2 2 0 0 1 15 17 H13" />
    <path d="M9 10 H3 M6 7 L3 10 L6 13" />
  </SVG>
);
export const IconHelp = () => (
  <SVG>
    <circle cx="10" cy="10" r="7" />
    <path d="M7.5 8 A2.5 2.5 0 1 1 10 10.5 V12" />
    <circle cx="10" cy="15" r="0.5" fill="currentColor" />
  </SVG>
);
