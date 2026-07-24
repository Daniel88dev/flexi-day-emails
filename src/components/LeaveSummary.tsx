import { Column, Row, Section, Text } from "@react-email/components";
import { colors, radius } from "../theme";

export interface LeaveSummaryRow {
  label: string;
  value: string;
}

/**
 * Compact key/value block describing a leave request (type, dates, length,
 * note …). Shared by every vacation workflow email so the request details
 * always read the same way.
 *
 * Values are usually literal `{{placeholder}}` tokens — keep them as plain
 * text nodes so SES substitution is not mangled.
 */
export function LeaveSummary({ rows }: { rows: LeaveSummaryRow[] }) {
  return (
    <Section style={box}>
      {rows.map((row) => (
        <Row key={row.label} style={rowStyle}>
          <Column style={labelCell}>
            <Text style={labelText}>{row.label}</Text>
          </Column>
          <Column style={valueCell}>
            <Text style={valueText}>{row.value}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

const box = {
  backgroundColor: colors.surfaceMuted,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: "14px 16px",
  margin: "0 0 20px",
};

const rowStyle = {
  width: "100%",
};

const labelCell = {
  width: "38%",
  verticalAlign: "top" as const,
};

const valueCell = {
  verticalAlign: "top" as const,
};

const labelText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: colors.textMuted,
  margin: "3px 0",
};

const valueText = {
  fontSize: "13px",
  lineHeight: "20px",
  fontWeight: 600,
  color: colors.text,
  margin: "3px 0",
};
