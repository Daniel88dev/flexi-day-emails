import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { brand, colors, fonts, radius } from "../theme.js";
import { Logo } from "./Logo.js";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

/**
 * Shared chrome for all flexiday emails: warm-paper background, a card
 * with the logo header, and a footer with sender info.
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Logo />
          </Section>
          <Section style={card}>{children}</Section>
          <Section style={footer}>
            <Text style={footerText}>{brand.senderInfo}</Text>
            <Text style={footerText}>
              You received this email because an account was created with your
              address. If that wasn&apos;t you, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: colors.background,
  fontFamily: fonts.sans,
  color: colors.text,
  margin: 0,
  padding: "24px 12px",
};

const container = {
  maxWidth: "520px",
  margin: "0 auto",
};

const header = {
  padding: "16px 8px",
};

const card = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  padding: "32px",
};

const footer = {
  padding: "20px 8px 0",
};

const footerText = {
  color: colors.textFaint,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 4px",
};
