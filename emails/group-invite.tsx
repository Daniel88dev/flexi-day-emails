import { Heading, Hr, Link, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button";
import { EmailLayout } from "../src/components/EmailLayout";
import { colors, radius } from "../src/theme";
import {
  buttonSection,
  divider,
  heading,
  link,
  muted,
  paragraph,
} from "../src/styles";

/**
 * Sent when a group admin invites someone by email. The invite code lives in
 * the body only — `signUpUrl` is the plain sign-up page and carries nothing,
 * so forwarding the link alone grants no access. Triggered by flexi-day-be
 * from POST /api/group-user/{groupId}/invites.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject =
  "{{inviterName}} invited you to join {{groupName}} on flexiday";

interface GroupInviteProps {
  groupName?: string;
  inviterName?: string;
  inviteCode?: string;
  signUpUrl?: string;
  joinUrl?: string;
  invitedEmail?: string;
  expiresIn?: string;
}

export default function GroupInvite({
  groupName = "{{groupName}}",
  inviterName = "{{inviterName}}",
  inviteCode = "{{inviteCode}}",
  signUpUrl = "{{signUpUrl}}",
  joinUrl = "{{joinUrl}}",
  invitedEmail = "{{invitedEmail}}",
  expiresIn = "{{expiresIn}}",
}: GroupInviteProps) {
  return (
    <EmailLayout
      preview="You have been invited to join a team on flexiday"
      footerNote="You received this email because someone invited you to their team on flexiday. If you weren't expecting it, you can ignore this message — the code does nothing until it is used."
    >
      {/*
       * No placeholder in the heading: the plain-text render uppercases
       * headings, which would turn {{groupName}} into {{GROUPNAME}} — a token
       * SES does not substitute.
       */}
      <Heading as="h1" style={heading}>
        You&apos;re invited to a team
      </Heading>
      <Text style={paragraph}>
        {inviterName} invited you to join <strong>{groupName}</strong> on
        flexiday, where the team books and tracks time off.
      </Text>

      <Text style={stepHeading}>Your invite code</Text>
      <Section style={codeBox}>
        <Text style={codeText}>{inviteCode}</Text>
      </Section>
      <Text style={muted}>
        This code works once, only for {invitedEmail}, and expires in{" "}
        {expiresIn}.
      </Text>

      <Hr style={divider} />

      <Text style={stepHeading}>How to join</Text>
      <Text style={paragraph}>
        <strong>1.</strong> Create your flexiday account using this email
        address — {invitedEmail}. The code only works for that address, so
        please don&apos;t sign up with a different one. You don&apos;t need to
        enter a company or team name.
      </Text>
      <Section style={buttonSection}>
        <Button href={signUpUrl}>Create your account</Button>
      </Section>
      <Text style={paragraph}>
        <strong>2.</strong> Confirm your email address using the message we send
        you right after sign-up.
      </Text>
      <Text style={paragraph}>
        <strong>3.</strong> Open <strong>Groups</strong>, paste the code above
        into <strong>Join a group</strong>, and you&apos;re in.
      </Text>

      <Text style={muted}>
        Already have a flexiday account? Skip step 1 and go straight to Groups:
      </Text>
      <Text style={muted}>
        <Link href={joinUrl} style={link}>
          {joinUrl}
        </Link>
      </Text>

      <Hr style={divider} />

      <Text style={muted}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Text>
      <Text style={muted}>
        <Link href={signUpUrl} style={link}>
          {signUpUrl}
        </Link>
      </Text>
      <Text style={muted}>
        Once you join, your time off in {groupName} is approved by that
        team&apos;s approver.
      </Text>
    </EmailLayout>
  );
}

const stepHeading = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: colors.textMuted,
  margin: "0 0 10px",
};

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
