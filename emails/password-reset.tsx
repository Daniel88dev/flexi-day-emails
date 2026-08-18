import { Heading, Hr, Link, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button";
import { EmailLayout } from "../src/components/EmailLayout";
import {
  buttonSection,
  divider,
  heading,
  link,
  muted,
  paragraph,
} from "../src/styles";

/**
 * Password reset, sent by better-auth's sendResetPassword hook in
 * flexi-day-be (src/utils/auth.ts). The backend provides the user's name, the
 * reset URL and the token expiry.
 *
 * Also the way someone who only ever signed in with Google or Microsoft gets a
 * password at all: better-auth's resetPassword creates the credential account
 * when the user has none. The copy therefore avoids claiming an old password
 * exists.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "Set a new flexiday password";

interface PasswordResetProps {
  name?: string;
  resetUrl?: string;
  expiresIn?: string;
}

export default function PasswordReset({
  name = "{{name}}",
  resetUrl = "{{resetUrl}}",
  expiresIn = "{{expiresIn}}",
}: PasswordResetProps) {
  return (
    <EmailLayout
      preview="Choose a new password for your flexiday account"
      // The layout's default says an account was just created with this
      // address — false here, and on a security email a wrong reason is what
      // makes a real message read as a phish.
      footerNote="You received this email because someone asked to set a new password for the flexiday account at this address. If that wasn't you, ignore this message — the link expires on its own and nothing changes until it is used. Account emails like this one are always sent, regardless of your notification preferences."
    >
      <Heading as="h1" style={heading}>
        Choose a new password
      </Heading>
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        We received a request to set a new password for your flexiday account.
        Use the button below to choose one.
      </Text>
      <Section style={buttonSection}>
        <Button href={resetUrl}>Set a new password</Button>
      </Section>
      <Text style={muted}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Text>
      <Text style={muted}>
        <Link href={resetUrl} style={link}>
          {resetUrl}
        </Link>
      </Text>
      <Hr style={divider} />
      <Text style={muted}>
        This link expires in {expiresIn} and can be used once. If you
        didn&apos;t ask for it, you can ignore this email — your account is
        unchanged and your current way of signing in keeps working.
      </Text>
      <Text style={muted}>
        If your email address has never been confirmed, setting a password also
        confirms it and disconnects any Google or Microsoft sign-in from the
        account. You can connect them again under Settings → Sign-in methods.
      </Text>
    </EmailLayout>
  );
}
