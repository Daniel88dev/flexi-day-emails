/**
 * Text styles shared by every template body. Kept in one place so the
 * vacation-workflow emails and the confirmation email stay visually
 * identical — the values are the ones email-confirmation.tsx introduced.
 */
import { colors, fonts } from "./theme";

export const heading = {
  fontFamily: fonts.display,
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "1.15",
  color: colors.text,
  margin: "0 0 20px",
};

export const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.text,
  margin: "0 0 14px",
};

export const buttonSection = {
  padding: "10px 0 22px",
};

export const muted = {
  fontSize: "13px",
  lineHeight: "20px",
  color: colors.textMuted,
  margin: "0 0 10px",
};

export const link = {
  color: colors.primary,
  wordBreak: "break-all" as const,
};

export const divider = {
  borderColor: colors.border,
  margin: "18px 0",
};
