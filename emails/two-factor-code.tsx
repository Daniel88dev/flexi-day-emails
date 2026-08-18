import { Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "../src/components/EmailLayout";
import { colors, radius } from "../src/theme";
import { divider, heading, muted, paragraph } from "../src/styles";

/**
 * Two-factor verification code, sent by the better-auth twoFactor plugin's
 * sendOTP hook in flexi-day-be (src/utils/auth.ts). The same template covers
 * both triggers — a second factor at sign-in, and proving the address while
 * enrolling from Settings — so the copy must not assume either one.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (no code here — it would leak into previews). */
export const subject = "Your flexiday verification code";

interface TwoFactorCodeProps {
  name?: string;
  code?: string;
  expiresIn?: string;
}

export default function TwoFactorCode({
  name = "{{name}}",
  code = "{{code}}",
  expiresIn = "{{expiresIn}}",
}: TwoFactorCodeProps) {
  return (
    <EmailLayout
      preview="Use this code to verify it's you"
      // The layout's default says an account was just created with this
      // address — false here, and on a security email a wrong reason is what
      // makes a real message read as a phish.
      footerNote="You received this email because a verification code was requested for the flexiday account at this address — when signing in, or when managing two-factor authentication in Settings. If that wasn't you, someone may know your password — change it under Settings, or use Forgot password on the sign-in page. Account emails like this one are always sent, regardless of your notification preferences."
    >
      <Heading as="h1" style={heading}>
        Your verification code
      </Heading>
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        Enter this code in flexiday to verify it&apos;s you:
      </Text>
      <Section style={codeBox}>
        <Text style={codeText}>{code}</Text>
      </Section>
      <Text style={muted}>
        The code expires in {expiresIn} and works once. flexiday will never ask
        you for it anywhere except the screen where you requested it.
      </Text>
      <Hr style={divider} />
      <Text style={muted}>
        If you didn&apos;t request a code — at sign-in or in Settings — someone
        else may have access to your account, usually because they know your
        password. Change your password from Settings, or use Forgot password on
        the sign-in page. The code on its own grants no access.
      </Text>
    </EmailLayout>
  );
}

const codeBox = {
  backgroundColor: colors.surfaceMuted,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: "16px",
  margin: "0 0 10px",
  textAlign: "center" as const,
};

const codeText = {
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  fontSize: "24px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: colors.text,
  margin: 0,
};
