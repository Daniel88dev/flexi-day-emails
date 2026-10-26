import { Heading, Hr, Link, Section, Text } from "@react-email/components";
import { Button } from "../src/components/Button";
import { EmailLayout } from "../src/components/EmailLayout";
import { buttonSection, divider, heading, link, muted, paragraph } from "../src/styles";

/**
 * Sent when an admin invites a person who has no account yet from the
 * organization's people directory. Triggered by flexi-day-be from
 * POST /api/directory/{organizationId}/people/{employmentId}/invite.
 *
 * The recipient has no account and so no language setting, which is why the
 * message carries English first and Czech below it. It names the
 * organization, never a group, and carries the invite link only.
 *
 * The default props are literal SES/Handlebars placeholders. `render()` must
 * output them untouched; the build asserts this (src/verify.ts).
 */

/** SES template Subject part (placeholders allowed). */
export const subject =
  "{{inviterName}} invited you to {{organizationName}} on flexiday / Pozvánka do {{organizationName}}";

interface DirectoryInviteProps {
  organizationName?: string;
  inviterName?: string;
  personName?: string;
  inviteUrl?: string;
  invitedEmail?: string;
  expiresIn?: string;
  expiresInCs?: string;
}

export default function DirectoryInvite({
  organizationName = "{{organizationName}}",
  inviterName = "{{inviterName}}",
  personName = "{{personName}}",
  inviteUrl = "{{inviteUrl}}",
  invitedEmail = "{{invitedEmail}}",
  expiresIn = "{{expiresIn}}",
  expiresInCs = "{{expiresInCs}}",
}: DirectoryInviteProps) {
  return (
    <EmailLayout
      preview="You have been invited to your organization on flexiday / Pozvánka do vaší organizace ve flexiday"
      footerNote={
        <>
          You received this email because an organization on flexiday keeps a profile with your
          address. If you weren&apos;t expecting it, ignore it: nothing happens until the invite is
          used. / Tento e-mail jste dostali, protože organizace ve flexiday vede profil s vaší
          adresou. Pokud jste ho nečekali, nevšímejte si ho: dokud pozvánku nikdo nepoužije, nic se
          nestane.
        </>
      }
    >
      {/* No placeholder in a heading: the plain-text render uppercases headings. */}
      <Heading as="h1" style={heading}>
        You&apos;re invited to flexiday
      </Heading>
      <Text style={paragraph}>Hi {personName},</Text>
      <Text style={paragraph}>
        {inviterName} invited you to <strong>{organizationName}</strong> on flexiday, where the
        organization keeps its people directory and books time off. Accept the invite to create your
        account or sign in, and your profile there becomes yours.
      </Text>
      <Section style={buttonSection}>
        <Button href={inviteUrl}>Accept the invite</Button>
      </Section>
      <Text style={muted}>
        This invite works once, only for {invitedEmail}, and expires in {expiresIn}.
      </Text>
      <Text style={muted}>
        If the button doesn&apos;t work, copy and paste this link into your browser:
      </Text>
      <Text style={muted}>
        <Link href={inviteUrl} style={link}>
          {inviteUrl}
        </Link>
      </Text>

      <Hr style={divider} />

      <Section lang="cs">
        <Heading as="h2" style={heading}>
          Pozvánka do flexiday
        </Heading>
        <Text style={paragraph}>Dobrý den, {personName},</Text>
        <Text style={paragraph}>
          {inviterName} vás pozval(a) do organizace <strong>{organizationName}</strong> ve flexiday,
          kde organizace vede adresář lidí a plánuje volno. Přijměte pozvánku, vytvořte si účet nebo
          se přihlaste a váš profil v organizaci bude váš.
        </Text>
        <Section style={buttonSection}>
          <Button href={inviteUrl}>Přijmout pozvánku</Button>
        </Section>
        <Text style={muted}>
          Pozvánka funguje jednou, jen pro {invitedEmail}, a vyprší za {expiresInCs}.
        </Text>
        <Text style={muted}>Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:</Text>
        <Text style={muted}>
          <Link href={inviteUrl} style={link}>
            {inviteUrl}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
}
