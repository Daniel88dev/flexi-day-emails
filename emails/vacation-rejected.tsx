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
 * Sent to the requesting employee when an approver declines their time-off
 * request. Triggered by flexi-day-be on rejection (single or bulk).
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "Your time-off request was declined";

interface VacationRejectedProps {
  employeeName?: string;
  approverName?: string;
  teamName?: string;
  leaveType?: string;
  dateRange?: string;
  dayCount?: string;
  reason?: string;
  requestUrl?: string;
}

export default function VacationRejected({
  employeeName = "{{employeeName}}",
  approverName = "{{approverName}}",
  teamName = "{{teamName}}",
  leaveType = "{{leaveType}}",
  dateRange = "{{dateRange}}",
  dayCount = "{{dayCount}}",
  reason = "{{reason}}",
  requestUrl = "{{requestUrl}}",
}: VacationRejectedProps) {
  return (
    <EmailLayout
      preview="Your time-off request was declined"
      footerNote="You received this email because you requested time off on flexiday. You can turn these notifications off in your account settings."
    >
      <Heading as="h1" style={heading}>
        Request declined
      </Heading>
      <Text style={paragraph}>Hi {employeeName},</Text>
      <Text style={paragraph}>
        {approverName} declined your time-off request in {teamName}.
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
        Talk to your approver if the dates could work another way — you can
        always submit a new request.
      </Text>
    </EmailLayout>
  );
}
