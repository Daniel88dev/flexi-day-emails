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
 * Sent when a group admin invites someone by email. Triggered by flexi-day-be
 * from POST /api/group-user/{groupId}/invites. Link vs code: see INTEGRATION.md.
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
  inviteUrl?: string;
  invitedEmail?: string;
  expiresIn?: string;
}

export default function GroupInvite({
  groupName = "{{groupName}}",
  inviterName = "{{inviterName}}",
  inviteCode = "{{inviteCode}}",
  inviteUrl = "{{inviteUrl}}",
  invitedEmail = "{{invitedEmail}}",
  expiresIn = "{{expiresIn}}",
}: GroupInviteProps) {
  return (
    <EmailLayout
      preview="You have been invited to join a team on flexiday"
      footerNote="You received this email because someone invited you to their team on flexiday. If you weren't expecting it, you can ignore this message — nothing happens until the invite is used."
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
      <Section style={buttonSection}>
        <Button href={inviteUrl}>Join {groupName}</Button>
      </Section>
      <Text style={muted}>
        This invite works once, only for {invitedEmail}, and expires in{" "}
        {expiresIn}.
      </Text>
      <Text style={muted}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Text>
      <Text style={muted}>
        <Link href={inviteUrl} style={link}>
          {inviteUrl}
        </Link>
      </Text>

      <Hr style={divider} />

      <Text style={muted}>
        Or paste this code in <strong>Groups</strong>:
      </Text>
      <Section style={codeBox}>
        <Text style={codeText}>{inviteCode}</Text>
      </Section>
      <Text style={muted}>
        The code only works once your email address is confirmed. The Join
        button confirms it for you.
      </Text>
      <Text style={muted}>
        Once you join, your time off in {groupName} is approved by that
        team&apos;s approver.
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
