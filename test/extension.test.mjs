// AI Modifier Paste against mocked PopClip and mocked APIs. With
// ANTHROPIC_API_KEY / OPENROUTER_API_KEY set, it also makes live calls.
import assert from "node:assert/strict";
import { ctx, defaults, input, load, mockAxios, realAxios, run } from "./load.mjs";

const PKG = "AIModifierPaste.popclipext";
const KEYS = {
  anthropicKey: process.env.ANTHROPIC_API_KEY || "sk-ant-test",
  openrouterKey: process.env.OPENROUTER_API_KEY || "sk-or-test",
};
const opts = (ext, overrides = {}) => ({ ...defaults(ext, ""), ...KEYS, ...overrides });

const claudeOk = (text, extra = {}) => () => ({
  data: { content: [{ type: "thinking", thinking: "" }, { type: "text", text }], stop_reason: "end_turn", ...extra },
});
const routerOk = (content, finish_reason = "stop") => () => ({
  data: { choices: [{ message: { role: "assistant", content, reasoning: "hidden" }, finish_reason }] },
});
// answers in whichever API's shape the request was sent to
const anyOk = (text) => (body) => (body.system !== undefined ? claudeOk(text)() : routerOk(text)());

async function click(overrides, { respond = anyOk("R"), modifiers, context = ctx, slot = 1 } = {}) {
  const ax = mockAxios(respond);
  const { ext, calls } = load(PKG, { axios: ax, modifiers });
  const options = opts(ext, overrides);
  await ext.actions(input, options, context).submenu[slot].code(input, options, context);
  return { sent: ax.sent, calls };
}

await run("population: AI submenu, buttons layout, hidden slots, empty selection", () => {
  const { ext } = load(PKG, { axios: mockAxios(anyOk("x")) });
  const r = ext.actions(input, opts(ext), ctx);
  assert.equal(r.title, "AI");
  assert.deepEqual(r.submenu.map((a) => a.title), ["Voicemail → Email", "Polish", "Summarize", "Draft Reply"]);
  const b = ext.actions(input, opts(ext, { layout: "buttons", name2: "", name5: "Custom", prompt5: "Do X" }), ctx);
  assert.deepEqual(b.map((a) => a.title), ["Voicemail → Email", "Summarize", "Draft Reply", "Custom"]);
  assert.equal(ext.actions({ text: "  " }, opts(ext), ctx), undefined);
});

await run("anthropic: request shape, fallbacks, thinking dropped, replace paste", async () => {
  const { sent, calls } = await click({}, { respond: claudeOk("Subject: Callback\n\nHi Dana,"), slot: 0 });
  const { url, body, headers } = sent[0];
  assert.equal(url, "https://api.anthropic.com/v1/messages");
  assert.equal(body.model, "claude-opus-5-5");
  assert.equal(headers["x-api-key"], KEYS.anthropicKey);
  assert.equal(body.fallbacks, "default");
  assert.equal(headers["anthropic-beta"], "server-side-fallback-2026-07-01");
  assert.deepEqual(body.output_config, { effort: "low" });
  assert.match(body.system, /voicemail transcript/);
  assert.match(body.messages[0].content, /^<selected_text>\nHi it's Dana/);
  assert.deepEqual(calls, [["paste", "Subject: Callback\n\nHi Dana,", { restore: true }]]);
});

await run("anthropic: haiku gets no fallbacks", async () => {
  const { sent } = await click({ anthropicModel: "claude-haiku-5-5" });
  assert.equal(sent[0].body.fallbacks, undefined);
  assert.equal(sent[0].headers["anthropic-beta"], undefined);
});

await run("openrouter: request shape and default model", async () => {
  const { sent, calls } = await click({ provider: "openrouter", effort: "medium" }, { slot: 0 });
  const { url, body, headers } = sent[0];
  assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(body.model, "anthropic/claude-opus-5.5");
  assert.deepEqual(body.reasoning, { effort: "medium", exclude: true });
  assert.equal(body.messages[0].role, "system");
  assert.match(body.messages[0].content, /voicemail transcript/);
  assert.match(body.messages[1].content, /^<selected_text>\nHi it's Dana/);
  assert.equal(headers.Authorization, `Bearer ${KEYS.openrouterKey}`);
  assert.equal(headers["X-OpenRouter-Title"], "AI Modifier Paste");
  assert.deepEqual(calls, [["paste", "R", { restore: true }]]);
});

await run("control switches provider for one click", async () => {
  let { sent } = await click({}, { modifiers: { control: true } });
  assert.equal(sent[0].url, "https://openrouter.ai/api/v1/chat/completions");
  ({ sent } = await click({ provider: "openrouter" }, { modifiers: { control: true } }));
  assert.equal(sent[0].url, "https://api.anthropic.com/v1/messages");
});

await run("delivery: option appends, shift copies, no-paste copies, truncation noted", async () => {
  for (const [mods, context, expected] of [
    [{ option: true }, ctx, ["paste", `${input.text}\n\nR`, { restore: true }]],
    [{ shift: true }, ctx, ["copy", "R"]],
    [{}, { canPaste: false }, ["copy", "R"]],
  ]) {
    const { calls } = await click({}, { modifiers: mods, context });
    assert.deepEqual(calls, [expected]);
  }
  const { calls } = await click({ provider: "openrouter" }, { respond: routerOk("part", "length") });
  assert.deepEqual(calls[0], ["paste", "part\n\n[truncated: response hit the length limit]", { restore: true }]);
});

await run("errors: missing key and 401 open settings; others are shown", async () => {
  const fail = (status, message) => () => {
    throw Object.assign(new Error("x"), { response: { status, data: { error: { message, code: status } } } });
  };
  await assert.rejects(click({ anthropicKey: "" }), /Settings error: add your Claude API key/);
  await assert.rejects(click({ provider: "openrouter", openrouterKey: "" }), /Settings error: add your OpenRouter key/);
  await assert.rejects(click({}, { respond: fail(401, "invalid x-api-key") }), /^Error: Settings error: Claude API error 401/);
  await assert.rejects(click({ provider: "openrouter" }, { respond: fail(401, "bad key") }), /^Error: Settings error: OpenRouter error 401/);

  for (const [o, respond, shown] of [
    [{}, fail(400, "bad model"), "Claude API error 400: bad model"],
    [{}, claudeOk("", { stop_reason: "refusal", content: [] }), "The model declined this request."],
    [{ provider: "openrouter" }, fail(402, "Insufficient credits"), "OpenRouter error 402: Insufficient credits"],
    [{ provider: "openrouter" }, routerOk("", "content_filter"), "The model declined this request."],
    [{ provider: "openrouter" }, () => ({ data: { choices: [{ error: { code: 502, message: "Provider down" } }] } }), "Model error 502: Provider down"],
  ]) {
    const { calls } = await click(o, { respond });
    assert.deepEqual(calls, [["show", shown]]);
  }
});

for (const [provider, env] of [["anthropic", "ANTHROPIC_API_KEY"], ["openrouter", "OPENROUTER_API_KEY"]]) {
  if (!process.env[env]) {
    console.log(`skip - live ${provider} call (set ${env} to run it)`);
    continue;
  }
  await run(`live: ${provider} Voicemail → Email`, async () => {
    const { ext, calls } = load(PKG, { axios: realAxios });
    const options = opts(ext, { provider });
    await ext.actions(input, options, ctx).submenu[0].code(input, options, ctx);
    assert.equal(calls[0][0], "paste", JSON.stringify(calls));
    console.log(`\n${calls[0][1]}\n`);
  });
}
