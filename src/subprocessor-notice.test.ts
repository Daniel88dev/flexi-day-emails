import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { createElement } from "react";
import { render } from "@react-email/render";
import SubprocessorNotice, { subject } from "../emails/subprocessor-notice";

const anchors = (html: string) =>
  [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((match) => ({
    href: match[1] as string,
    inner: match[2] as string,
  }));

/** The two branches of the longest `{{#if czech}}` block in a part: the body, not the preview. */
const branches = (part: string) => {
  const blocks = [
    ...part.matchAll(/\{\{#if czech\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g),
  ];
  assert.ok(blocks.length > 0, "no {{#if czech}} block");
  const [, czech, english] = blocks.reduce((a, b) => (b[0].length > a[0].length ? b : a));
  return { czech: czech as string, english: english as string };
};

const squash = (text: string) => text.replace(/\s+/g, " ");

describe("subprocessor-notice", () => {
  let html = "";
  let text = "";

  before(async () => {
    html = await render(createElement(SubprocessorNotice), { pretty: false });
    text = await render(createElement(SubprocessorNotice), { plainText: true });
  });

  it("picks the subject by the owner's language", () => {
    const { czech, english } = branches(subject);
    assert.equal(english, "Flexi Day is adding Anthropic as a sub-processor on {{startDate}}");
    assert.equal(
      czech,
      "Flexi Day od {{startDate}} přidává společnost Anthropic jako dalšího zpracovatele"
    );
  });

  it("says the English notice in English only", () => {
    const english = squash(branches(text).english);
    for (const line of [
      "Hi {{name}},",
      "You own {{organizationName}} on Flexi Day. Our data processing agreement promises 30 days' notice before we add a sub-processor, so here it is.",
      "From {{startDate}}, owners on the Enterprise plan can turn on the Assistant, an AI that answers your members' questions about Flexi Day and makes changes they confirm.",
      "It runs on Anthropic, PBC, which stores chats in the United States and may process them in other countries, under the EU Standard Contractual Clauses.",
      "Anthropic doesn't train models on your data.",
      "Nothing reaches Anthropic unless you turn the Assistant on. It's off by default, and turning it on asks you to accept the AI features agreement.",
      "From today you can also allow AI connections, so members can connect AI apps they already use, such as Claude or ChatGPT. That's off by default too.",
      "If you object, leave the Assistant off, or reply to this email and tell us why.",
      "Daniel, Flexi Day",
    ]) {
      assert.ok(english.includes(line), `missing: ${line}`);
    }
    assert.doesNotMatch(english, /Dobrý den|Anthropic na vašich/);
    assert.doesNotMatch(english, /processes and stores chats/);
  });

  it("says the Czech notice in Czech only", () => {
    const czech = squash(branches(text).czech);
    for (const line of [
      "Dobrý den,",
      "jste vlastníkem organizace {{organizationName}} ve Flexi Day. Naše smlouva o zpracování osobních údajů slibuje oznámit nového dalšího zpracovatele 30 dní předem, a to teď děláme.",
      "Od {{startDate}} mohou vlastníci na tarifu Enterprise zapnout Asistenta, AI, která odpovídá na otázky vašich členů o Flexi Day a provádí změny, které potvrdí.",
      "Běží u společnosti Anthropic, PBC, která chaty ukládá ve Spojených státech a zpracovávat je může i v dalších zemích, na základě standardních smluvních doložek EU.",
      "Anthropic na vašich datech netrénuje modely.",
      "Ke společnosti Anthropic nic nedorazí, dokud Asistenta nezapnete. Ve výchozím stavu je vypnutý a při zapnutí vás požádá o přijetí Smlouvy o funkcích AI.",
      "Ode dneška můžete také povolit AI připojení, aby si členové mohli připojit AI aplikace, které už používají, například Claude nebo ChatGPT. I to je ve výchozím stavu vypnuté.",
      "Pokud nesouhlasíte, nechte Asistenta vypnutého, nebo na tento e-mail odpovězte a napište nám proč.",
      "Daniel, Flexi Day",
    ]) {
      assert.ok(czech.includes(line), `missing: ${line}`);
    }
    assert.doesNotMatch(czech, /Hi \{\{name\}\}|You own/);
  });

  it("links what changed to each language's legal pages", () => {
    const english = anchors(branches(html).english).map((a) => [a.inner, a.href]);
    assert.deepEqual(english, [
      ["sub-processors in the DPA", "https://www.flexi-day.com/dpa/"],
      ["Privacy Policy", "https://www.flexi-day.com/privacy/#what-changed"],
      ["Security", "https://www.flexi-day.com/security/"],
      ["AI features agreement", "https://www.flexi-day.com/ai-agreement/"],
    ]);
    const czech = anchors(branches(html).czech).map((a) => [a.inner, a.href]);
    assert.deepEqual(czech, [
      ["Další zpracovatelé", "https://www.flexi-day.com/cs/dpa/"],
      ["Zásady ochrany osobních údajů", "https://www.flexi-day.com/cs/privacy/#what-changed"],
      ["Zabezpečení", "https://www.flexi-day.com/security/"],
      ["Smlouva o funkcích AI", "https://www.flexi-day.com/cs/ai-agreement/"],
    ]);
  });

  it("keeps every Handlebars block balanced in each part", () => {
    for (const part of [subject, html, text]) {
      const opened = part.match(/\{\{#if czech\}\}/g)?.length ?? 0;
      assert.ok(opened >= 1);
      assert.equal(part.match(/\{\{else\}\}/g)?.length, opened);
      assert.equal(part.match(/\{\{\/if\}\}/g)?.length, opened);
    }
  });
});
