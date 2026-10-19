import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { createElement } from "react";
import { render } from "@react-email/render";
import VacationRequestCancelled, { subject } from "../emails/vacation-request-cancelled";

describe("vacation-request-cancelled", () => {
  let html = "";
  let text = "";

  before(async () => {
    html = (await render(createElement(VacationRequestCancelled), { pretty: false })).replaceAll(
      "<!-- -->",
      ""
    );
    text = await render(createElement(VacationRequestCancelled), { plainText: true });
  });

  it("tells the member who cancelled their request and where", () => {
    assert.equal(subject, "Your time-off request was cancelled");
    for (const part of [html, text]) {
      assert.match(part, /\{\{cancelledByName\}\} cancelled your time-off request in/);
      assert.match(part, /\{\{teamName\}\}/);
      assert.match(part, /\{\{employeeName\}\}/);
    }
  });

  it("carries type, dates, day count, reason and the request link", () => {
    for (const part of [html, text]) {
      for (const token of ["leaveType", "dateRange", "dayCount", "reason", "requestUrl"]) {
        assert.ok(part.includes(`{{${token}}}`), `${token} missing`);
      }
    }
  });
});
