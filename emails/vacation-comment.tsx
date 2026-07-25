import { Heading, Hr, Link, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button";
import { EmailLayout } from "../src/components/EmailLayout";
import { LeaveSummary } from "../src/components/LeaveSummary";
import {
  buttonSection,
  divider,
  heading,
  link,
  muted,
  paragraph,
} from "../src/styles";

/**
 * Sent when someone comments on a time-off request without changing its
 * decision — to the requester when an approver comments, or to the approver
 * when the requester comments. Triggered by flexi-day-be on a new comment.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "New comment on a time-off request";

interface VacationCommentProps {
  recipientName?: string;
  employeeName?: string;
  commenterName?: string;
  teamName?: string;
  leaveType?: string;
  dateRange?: string;
  message?: string;
  requestUrl?: string;
}

export default function VacationComment({
  recipientName = "{{recipientName}}",
  employeeName = "{{employeeName}}",
  commenterName = "{{commenterName}}",
  teamName = "{{teamName}}",
  leaveType = "{{leaveType}}",
  dateRange = "{{dateRange}}",
  message = "{{message}}",
  requestUrl = "{{requestUrl}}",
}: VacationCommentProps) {
  return (
    <EmailLayout
      preview="New comment on a time-off request"
      footerNote="You received this email because it concerns time off you requested or approve on flexiday. You can turn these notifications off in your account settings."
    >
      <Heading as="h1" style={heading}>
        New comment
      </Heading>
      <Text style={paragraph}>Hi {recipientName},</Text>
      <Text style={paragraph}>
        {commenterName} commented on {employeeName}&apos;s time-off request in{" "}
        {teamName}.
      </Text>
      <LeaveSummary
        rows={[
          { label: "Type", value: leaveType },
          { label: "Dates", value: dateRange },
          { label: "Comment", value: message },
        ]}
      />
      <Section style={buttonSection}>
        <Button href={requestUrl}>View request</Button>
      </Section>
      <Text style={muted}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Text>
      <Text style={muted}>
        <Link href={requestUrl} style={link}>
          {requestUrl}
        </Link>
      </Text>
      <Hr style={divider} />
      <Text style={muted}>
        Reply on flexiday to keep the conversation in one place.
      </Text>
    </EmailLayout>
  );
}
