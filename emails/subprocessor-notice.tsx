import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "../src/components/EmailLayout";
import { paragraph, textLink } from "../src/styles";

/**
 * The 30-day notice that Anthropic becomes a sub-processor, sent once to the owner of every
 * organization by flexi-day-be's `subprocessor-notice` command. One template carries both
 * languages: SES evaluates `{{#if czech}}` at send time, and the backend passes `czech` as a
 * boolean from the owner's language. `startDate` is the day the Assistant may open, formatted
 * by the backend in that language.
 */

/** SES template Subject part (placeholders allowed). */
export const subject =
  "{{#if czech}}Flexi Day od {{startDate}} přidává společnost Anthropic jako dalšího zpracovatele{{else}}Flexi Day is adding Anthropic as a sub-processor on {{startDate}}{{/if}}";

const SITE = "https://www.flexi-day.com";

interface SubprocessorNoticeProps {
  name?: string;
  organizationName?: string;
  startDate?: string;
}

const either = (czech: string, english: string) => `{{#if czech}}${czech}{{else}}${english}{{/if}}`;

export default function SubprocessorNotice({
  name = "{{name}}",
  organizationName = "{{organizationName}}",
  startDate = "{{startDate}}",
}: SubprocessorNoticeProps) {
  return (
    <EmailLayout
      preview={either(
        "Anthropic bude dalším zpracovatelem Flexi Day",
        "Anthropic becomes a Flexi Day sub-processor"
      )}
      footerNote={either(
        "Tento e-mail jste dostali, protože jste vlastníkem organizace ve Flexi Day.",
        "You received this email because you own an organization on Flexi Day."
      )}
    >
      {"{{#if czech}}"}
      <Section lang="cs">
        <Text style={paragraph}>Dobrý den,</Text>
        <Text style={paragraph}>
          jste vlastníkem organizace {organizationName} ve Flexi Day. Naše smlouva o zpracování
          osobních údajů slibuje oznámit nového dalšího zpracovatele 30 dní předem, a to teď děláme.
        </Text>
        <Text style={paragraph}>
          Od {startDate} mohou vlastníci na tarifu Enterprise zapnout Asistenta, AI, která odpovídá
          na otázky vašich členů o Flexi Day a provádí změny, které potvrdí. Běží u společnosti
          Anthropic, PBC, která chaty ukládá ve Spojených státech a zpracovávat je může i v dalších
          zemích, na základě standardních smluvních doložek EU. Anthropic na vašich datech netrénuje
          modely.
        </Text>
        <Text style={paragraph}>
          Ke společnosti Anthropic nic nedorazí, dokud Asistenta nezapnete. Ve výchozím stavu je
          vypnutý a při zapnutí vás požádá o přijetí Smlouvy o funkcích AI.
        </Text>
        <Text style={paragraph}>
          Ode dneška můžete také povolit AI připojení, aby si členové mohli připojit AI aplikace,
          které už používají, například Claude nebo ChatGPT. I to je ve výchozím stavu vypnuté.
        </Text>
        <Text style={paragraph}>
          Co se změnilo:{" "}
          <Link href={`${SITE}/cs/dpa/`} style={textLink}>
            Další zpracovatelé
          </Link>
          {" · "}
          <Link href={`${SITE}/cs/privacy/#what-changed`} style={textLink}>
            Zásady ochrany osobních údajů
          </Link>
          {" · "}
          <Link href={`${SITE}/security/`} style={textLink}>
            Zabezpečení
          </Link>
          {" · "}
          <Link href={`${SITE}/cs/ai-agreement/`} style={textLink}>
            Smlouva o funkcích AI
          </Link>
        </Text>
        <Text style={paragraph}>
          Pokud nesouhlasíte, nechte Asistenta vypnutého, nebo na tento e-mail odpovězte a napište
          nám proč.
        </Text>
        <Text style={paragraph}>Daniel, Flexi Day</Text>
      </Section>
      {"{{else}}"}
      <Section>
        <Text style={paragraph}>Hi {name},</Text>
        <Text style={paragraph}>
          You own {organizationName} on Flexi Day. Our data processing agreement promises 30
          days&apos; notice before we add a sub-processor, so here it is.
        </Text>
        <Text style={paragraph}>
          From {startDate}, owners on the Enterprise plan can turn on the Assistant, an AI that
          answers your members&apos; questions about Flexi Day and makes changes they confirm. It
          runs on Anthropic, PBC, which stores chats in the United States and may process them in
          other countries, under the EU Standard Contractual Clauses. Anthropic doesn&apos;t train
          models on your data.
        </Text>
        <Text style={paragraph}>
          Nothing reaches Anthropic unless you turn the Assistant on. It&apos;s off by default, and
          turning it on asks you to accept the AI features agreement.
        </Text>
        <Text style={paragraph}>
          From today you can also allow AI connections, so members can connect AI apps they already
          use, such as Claude or ChatGPT. That&apos;s off by default too.
        </Text>
        <Text style={paragraph}>
          What changed:{" "}
          <Link href={`${SITE}/dpa/`} style={textLink}>
            sub-processors in the DPA
          </Link>
          {" · "}
          <Link href={`${SITE}/privacy/#what-changed`} style={textLink}>
            Privacy Policy
          </Link>
          {" · "}
          <Link href={`${SITE}/security/`} style={textLink}>
            Security
          </Link>
          {" · "}
          <Link href={`${SITE}/ai-agreement/`} style={textLink}>
            AI features agreement
          </Link>
        </Text>
        <Text style={paragraph}>
          If you object, leave the Assistant off, or reply to this email and tell us why.
        </Text>
        <Text style={paragraph}>Daniel, Flexi Day</Text>
      </Section>
      {"{{/if}}"}
    </EmailLayout>
  );
}
