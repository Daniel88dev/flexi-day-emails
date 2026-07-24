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
 * Sent to a group's approver (main or temp) when one of their team members
 * submits a time-off request that needs a decision. Triggered by
 * flexi-day-be when a vacation is created.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "{{employeeName}} requested time off";

interface VacationApprovalRequestProps {
  approverName?: string;
  employeeName?: string;
  teamName?: string;
  leaveType?: string;
  dateRange?: string;
  dayCount?: string;
  note?: string;
  requestUrl?: string;
}

export default function VacationApprovalRequest({
  approverName = "{{approverName}}",
  employeeName = "{{employeeName}}",
  teamName = "{{teamName}}",
  leaveType = "{{leaveType}}",
  dateRange = "{{dateRange}}",
  dayCount = "{{dayCount}}",
  note = "{{note}}",
  requestUrl = "{{requestUrl}}",
}: VacationApprovalRequestProps) {
  return (
    <EmailLayout
      preview="A team member is waiting for your approval"
      footerNote="You received this email because you approve time off for your team on flexiday. You can turn these notifications off in your account settings."
    >
      <Heading as="h1" style={heading}>
        Approval needed
      </Heading>
      <Text style={paragraph}>Hi {approverName},</Text>
      <Text style={paragraph}>
        {employeeName} requested time off in {teamName} and is waiting for your
        decision.
      </Text>
      <LeaveSummary
        rows={[
          { label: "Type", value: leaveType },
          { label: "Dates", value: dateRange },
          { label: "Days", value: dayCount },
          { label: "Note", value: note },
        ]}
      />
      <Section style={buttonSection}>
        <Button href={requestUrl}>Review request</Button>
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
        Approving or declining takes a click — your teammate is notified either
        way.
      </Text>
    </EmailLayout>
  );
}
