import { Heading, Hr, Link, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button";
import { EmailLayout } from "../src/components/EmailLayout";
import { LeaveSummary } from "../src/components/LeaveSummary";
import { buttonSection, divider, heading, link, muted, paragraph } from "../src/styles";

/**
 * Sent to the requesting employee when someone else (a manager or approver)
 * cancels their pending time-off request. Triggered by flexi-day-be on
 * cancellation (single or bulk). Approved time off cancelled by someone else
 * goes out as `vacation-cancelled` instead.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "Your time-off request was cancelled";

interface VacationRequestCancelledProps {
  employeeName?: string;
  cancelledByName?: string;
  teamName?: string;
  leaveType?: string;
  dateRange?: string;
  dayCount?: string;
  reason?: string;
  requestUrl?: string;
}

export default function VacationRequestCancelled({
  employeeName = "{{employeeName}}",
  cancelledByName = "{{cancelledByName}}",
  teamName = "{{teamName}}",
  leaveType = "{{leaveType}}",
  dateRange = "{{dateRange}}",
  dayCount = "{{dayCount}}",
  reason = "{{reason}}",
  requestUrl = "{{requestUrl}}",
}: VacationRequestCancelledProps) {
  return (
    <EmailLayout
      preview="Your time-off request was cancelled"
      footerNote="You received this email because you requested time off on flexiday. You can turn these notifications off in your account settings."
    >
      <Heading as="h1" style={heading}>
        Request cancelled
      </Heading>
      <Text style={paragraph}>Hi {employeeName},</Text>
      <Text style={paragraph}>
        {cancelledByName} cancelled your time-off request in {teamName}.
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
        If the button doesn&apos;t work, copy and paste this link into your browser:
      </Text>
      <Text style={muted}>
        <Link href={requestUrl} style={link}>
          {requestUrl}
        </Link>
      </Text>
      <Hr style={divider} />
      <Text style={muted}>
        Still need those days? Talk to {cancelledByName} or submit a new request.
      </Text>
    </EmailLayout>
  );
}
