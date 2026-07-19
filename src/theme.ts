/**
 * Design tokens extracted from the flexi-day frontend (app/globals.css).
 *
 * The frontend defines its palette in oklch; email clients need plain hex,
 * so the values below are the light-theme ("warm paper") tokens converted
 * to sRGB hex. Emails always render the light theme.
 */
export const colors = {
  /** --primary: oklch(0.55 0.165 285) */
  primary: "#6b5ecc",
  /** --primary-strong: oklch(0.48 0.165 285) */
  primaryStrong: "#5848b5",
  /** --primary-foreground: oklch(0.99 0.01 285) */
  primaryForeground: "#fbfbff",
  /** --bg: oklch(0.985 0.008 78) — warm paper page background */
  background: "#fdfaf4",
  /** --surface: oklch(0.998 0.004 80) — card background */
  surface: "#fffefb",
  /** --surface-2: oklch(0.972 0.009 78) */
  surfaceMuted: "#f9f5ef",
  /** --border-soft: oklch(0.915 0.01 80) */
  border: "#e6e2dc",
  /** --text: oklch(0.26 0.018 290) */
  text: "#24232c",
  /** --text-muted: oklch(0.52 0.014 288) */
  textMuted: "#686871",
  /** --text-faint: oklch(0.66 0.012 288) */
  textFaint: "#919199",
  /** --warm: oklch(0.66 0.14 42) — warm orange accent */
  warm: "#d87248",
} as const;

/**
 * The frontend loads Bricolage Grotesque (headings) and Hanken Grotesk
 * (body) from Google Fonts. Email clients mostly won't have them, so they
 * lead a safe fallback stack that keeps a similar grotesque feel.
 */
export const fonts = {
  display:
    "'Bricolage Grotesque', 'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  sans: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const;

/** Frontend --radius is 1rem; buttons in email use the md step (~12px). */
export const radius = {
  md: "12px",
  lg: "16px",
} as const;

export const brand = {
  name: "flexiday",
  websiteUrl: "https://flexi-day.com",
  senderInfo: "flexiday · flexi-day.com",
} as const;
