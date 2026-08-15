import { Heading, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button";
import { EmailLayout } from "../src/components/EmailLayout";
import { buttonSection, heading, muted, paragraph } from "../src/styles";

/**
 * Sent to the organization's billing address when a subscription payment
 * fails or the subscription is canceled. Full limits keep working until
 * {{graceEndsDate}}; after that, groups over the plan's limits become
 * read-only (nothing is deleted). Triggered by flexi-day-be's Paddle webhook
 * handler. Billing mail — ignores the user's email-notification preference.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched — the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject = "Action needed: your flexiday {{planName}} plan";

interface SubscriptionGraceProps {
  recipientName?: string;
  planName?: string;
  graceEndsDate?: string;
  billingUrl?: string;
}

export default function SubscriptionGrace({
  recipientName = "{{recipientName}}",
  planName = "{{planName}}",
  graceEndsDate = "{{graceEndsDate}}",
  billingUrl = "{{billingUrl}}",
}: SubscriptionGraceProps) {
  return (
    <EmailLayout
      preview="There is a problem with your flexiday subscription"
      footerNote="You received this email because you manage billing for a flexiday organization. Billing notices are sent regardless of your notification preferences."
    >
      {/*
       * No placeholder in the heading: the plain-text render uppercases
       * headings, which would break the {{token}} for SES.
       */}
      <Heading as="h1" style={heading}>
        There&apos;s a problem with your subscription
      </Heading>
      <Text style={paragraph}>Hi {recipientName},</Text>
      <Text style={paragraph}>
        We couldn&apos;t collect the latest payment for your{" "}
        <strong>{planName}</strong> plan, or the subscription was cancelled.
        Nothing changes right away: your teams keep their full limits until{" "}
        <strong>{graceEndsDate}</strong>.
      </Text>
      <Text style={paragraph}>
        After that date, groups over the Free plan&apos;s limits switch to
        read-only — they stay visible, but no new requests or approvals can be
        made in them. Nothing is ever deleted.
      </Text>
      <Section style={buttonSection}>
        <Button href={billingUrl}>Review billing</Button>
      </Section>
      <Text style={muted}>
        Updating your payment method or resubscribing restores everything
        instantly. If you meant to cancel, you don&apos;t need to do anything.
      </Text>
    </EmailLayout>
  );
}
