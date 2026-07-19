import { Heading, Hr, Link, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button.js";
import { EmailLayout } from "../src/components/EmailLayout.js";
import { colors, fonts } from "../src/theme.js";

/**
 * Email-address confirmation, sent by better-auth's sendVerificationEmail
 * hook in flexi-day-be (src/utils/auth.ts). The backend provides the user's
 * name, the verification URL, and the token expiry.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "Confirm your email address";

interface EmailConfirmationProps {
  name?: string;
  confirmationUrl?: string;
  expiresIn?: string;
}

export default function EmailConfirmation({
  name = "{{name}}",
  confirmationUrl = "{{confirmationUrl}}",
  expiresIn = "{{expiresIn}}",
}: EmailConfirmationProps) {
  return (
    <EmailLayout preview="Confirm your email address to start using flexiday">
      <Heading as="h1" style={heading}>
        Confirm your email
      </Heading>
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        Thanks for signing up for flexiday. Please confirm your email address
        so your team can start tracking vacations and flexible days together.
      </Text>
      <Section style={buttonSection}>
        <Button href={confirmationUrl}>Confirm email address</Button>
      </Section>
      <Text style={muted}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Text>
      <Text style={muted}>
        <Link href={confirmationUrl} style={link}>
          {confirmationUrl}
        </Link>
      </Text>
      <Hr style={divider} />
      <Text style={muted}>
        This link expires in {expiresIn}. If it has expired, sign in again to
        request a new confirmation email.
      </Text>
    </EmailLayout>
  );
}

const heading = {
  fontFamily: fonts.display,
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "1.15",
  color: colors.text,
  margin: "0 0 20px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.text,
  margin: "0 0 14px",
};

const buttonSection = {
  padding: "10px 0 22px",
};

const muted = {
  fontSize: "13px",
  lineHeight: "20px",
  color: colors.textMuted,
  margin: "0 0 10px",
};

const link = {
  color: colors.primary,
  wordBreak: "break-all" as const,
};

const divider = {
  borderColor: colors.border,
  margin: "18px 0",
};
