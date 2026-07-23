import { Heading, Hr, Link, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button";
import { EmailLayout } from "../src/components/EmailLayout";
import { buttonSection, divider, heading, link, muted, paragraph } from "../src/styles";

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
