import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { createElement } from "react";
import { render } from "@react-email/render";
import GroupInvite from "../emails/group-invite";

const anchors = (html: string) =>
  [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(
    (match) => ({
      href: match[1] as string,
      inner: match[2] as string,
    }),
  );

describe("group-invite", () => {
  let html = "";
  let text = "";

  before(async () => {
    html = await render(createElement(GroupInvite), { pretty: false });
    text = await render(createElement(GroupInvite), { plainText: true });
  });

  it("leads with a single Join button linking to the invite URL", () => {
    const joinButtons = anchors(html).filter((a) => /\bJoin\b/.test(a.inner));
    assert.equal(joinButtons.length, 1);
    assert.equal(joinButtons[0]?.href, "{{inviteUrl}}");
    assert.match(joinButtons[0]?.inner ?? "", /Join[\s\S]*\{\{groupName\}\}/);
    assert.match(text, /Join \{\{groupName\}\} \{\{inviteUrl\}\}/);
  });

  it("prints the invite code below the button as a fallback", () => {
    for (const part of [html, text]) {
      const button = part.indexOf("{{inviteUrl}}");
      const code = part.indexOf("{{inviteCode}}");
      assert.ok(button >= 0, "invite URL missing");
      assert.ok(code > button, "invite code must follow the Join button");
      assert.match(part, /paste this code in\s+(<strong>)?Groups/i);
    }
  });

  it("drops signUpUrl and joinUrl", () => {
    for (const part of [html, text]) {
      assert.doesNotMatch(part, /signUpUrl|joinUrl/);
      assert.doesNotMatch(part, /Create your account/);
    }
  });
});
