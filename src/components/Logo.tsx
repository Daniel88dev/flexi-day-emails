import { Column, Row } from "@react-email/components";
import { colors, fonts } from "../theme.js";

/**
 * Text recreation of the frontend Logo component (components/brand/logo.tsx):
 * a small violet dot mark next to the "flexiday" wordmark, with "day" in the
 * primary color. Pure HTML/CSS so it needs no hosted image asset.
 */
export function Logo() {
  return (
    <Row>
      <Column style={{ width: "26px", verticalAlign: "middle" }}>
        <span style={mark} />
      </Column>
      <Column style={{ verticalAlign: "middle" }}>
        <span style={wordmark}>
          flexi<span style={{ color: colors.primary }}>day</span>
        </span>
      </Column>
    </Row>
  );
}

const mark = {
  display: "inline-block",
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  backgroundColor: colors.primary,
  border: `3px solid ${colors.background}`,
  boxShadow: `0 0 0 1.5px ${colors.primary}`,
};

const wordmark = {
  fontFamily: fonts.display,
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: colors.text,
};
