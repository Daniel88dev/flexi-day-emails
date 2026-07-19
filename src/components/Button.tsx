import { Button as EmailButton } from "@react-email/components";
import type { ReactNode } from "react";
import { colors, fonts, radius } from "../theme.js";

interface ButtonProps {
  href: string;
  children: ReactNode;
}

/** Primary CTA button matching the frontend's violet primary button. */
export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton href={href} style={style}>
      {children}
    </EmailButton>
  );
}

const style = {
  backgroundColor: colors.primary,
  borderRadius: radius.md,
  color: colors.primaryForeground,
  fontFamily: fonts.sans,
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};
