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
 * Sent to the requesting employee when an approver accepts their time-off
 * request. Triggered by flexi-day-be on approval (single or bulk).
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "Your time off is approved";

interface VacationApprovedProps {
  employeeName?: string;
  approverName?: string;
  teamName?: string;
  leaveType?: string;
  dateRange?: string;
  dayCount?: string;
  requestUrl?: string;
}

export default function VacationApproved({
  employeeName = "{{employeeName}}",
  approverName = "{{approverName}}",
  teamName = "{{teamName}}",
  leaveType = "{{leaveType}}",
  dateRange = "{{dateRange}}",
  dayCount = "{{dayCount}}",
  requestUrl = "{{requestUrl}}",
}: VacationApprovedProps) {
  return (
    <EmailLayout
      preview="Your time-off request was approved"
      footerNote="You received this email because you requested time off on flexiday. You can turn these notifications off in your account settings."
    >
      <Heading as="h1" style={heading}>
        Time off approved
      </Heading>
      <Text style={paragraph}>Hi {employeeName},</Text>
      <Text style={paragraph}>
        {approverName} approved your request in {teamName}. It is now on the
        team calendar.
      </Text>
      <LeaveSummary
        rows={[
          { label: "Type", value: leaveType },
          { label: "Dates", value: dateRange },
          { label: "Days", value: dayCount },
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
        Plans changed? You can cancel approved time off from the request page.
      </Text>
    </EmailLayout>
  );
}
