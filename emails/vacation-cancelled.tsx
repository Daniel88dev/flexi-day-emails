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
 * Sent when time off that had already been approved is cancelled — to the
 * employee when an admin cancels it, or to the approver when the employee
 * cancels their own. Triggered by flexi-day-be on cancellation.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "Approved time off was cancelled";

interface VacationCancelledProps {
  recipientName?: string;
  employeeName?: string;
  cancelledByName?: string;
  teamName?: string;
  leaveType?: string;
  dateRange?: string;
  dayCount?: string;
  reason?: string;
  requestUrl?: string;
}

export default function VacationCancelled({
  recipientName = "{{recipientName}}",
  employeeName = "{{employeeName}}",
  cancelledByName = "{{cancelledByName}}",
  teamName = "{{teamName}}",
  leaveType = "{{leaveType}}",
  dateRange = "{{dateRange}}",
  dayCount = "{{dayCount}}",
  reason = "{{reason}}",
  requestUrl = "{{requestUrl}}",
}: VacationCancelledProps) {
  return (
    <EmailLayout
      preview="Approved time off was cancelled"
      footerNote="You received this email because it affects time off you requested or approve on flexiday. You can turn these notifications off in your account settings."
    >
      <Heading as="h1" style={heading}>
        Time off cancelled
      </Heading>
      <Text style={paragraph}>Hi {recipientName},</Text>
      <Text style={paragraph}>
        {cancelledByName} cancelled approved time off for {employeeName} in{" "}
        {teamName}. Those days are back on the team calendar as working days.
      </Text>
      <LeaveSummary
        rows={[
          { label: "Type", value: leaveType },
          { label: "Dates", value: dateRange },
          { label: "Days", value: dayCount },
          { label: "Reason", value: reason },
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
        Need those days back? Submit a new request and it will go through
        approval again.
      </Text>
    </EmailLayout>
  );
}
