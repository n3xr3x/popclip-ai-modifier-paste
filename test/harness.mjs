// Runs Config.ts against mocked PopClip globals and a mocked (or, with
// ANTHROPIC_API_KEY set, live) Claude API. Usage: npm test
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const realAxios = require("axios");

const src = readFileSync(new URL("../ClaudePrompts.popclipext/Config.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function load({ axios, modifiers = {} }) {
  const calls = [];
  const popclip = {
    modifiers: { shift: false, option: false, control: false, command: false, ...modifiers },
    pasteText: async (t, o) => calls.push(["paste", t, o]),
    copyText: async (t) => calls.push(["copy", t]),
    showText: (t) => calls.push(["show", t]),
  };
  const mod = { exports: {} };
  const req = (id) => (id === "axios" ? { default: axios, __esModule: true } : require(id));
  new Function("require", "module", "exports", "popclip", js)(req, mod, mod.exports, popclip);
  return { ext: mod.exports, calls };
}

function defaults(ext, overrides = {}) {
  const o = {};
  for (const opt of ext.options) {
    if (opt.type !== "heading") o[opt.identifier] = opt.defaultValue ?? "";
  }
  return { ...o, apikey: process.env.ANTHROPIC_API_KEY || "sk-test", ...overrides };
}

function mockAxios(respond) {
  const sent = [];
  return {
    sent,
    post: async (url, body, cfg) => {
      sent.push({ url, body, headers: cfg.headers });
      return respond(body);
    },
  };
}

const ok = (text, extra = {}) => () => ({
  data: { content: [{ type: "thinking", thinking: "" }, { type: "text", text }], stop_reason: "end_turn", ...extra },
});
const ctx = { canPaste: true };
const input = { text: "Hi it's Dana from Acme, call me back at 555-0100 about the Tuesday order." };

async function run(name, fn) {
  await fn();
  console.log(`ok - ${name}`);
}

await run("population: submenu of the four default prompts", () => {
  const { ext } = load({ axios: mockAxios(ok("x")) });
  const r = ext.actions(input, defaults(ext), ctx);
  assert.equal(r.title, "Claude");
  assert.deepEqual(r.submenu.map((a) => a.title), ["Voicemail → Email", "Polish", "Summarize", "Draft Reply"]);
});

await run("population: buttons layout, blank slots hidden, empty selection shows nothing", () => {
  const { ext } = load({ axios: mockAxios(ok("x")) });
  const r = ext.actions(input, defaults(ext, { layout: "buttons", name2: "", name5: "Custom", prompt5: "Do X" }), ctx);
  assert.deepEqual(r.map((a) => a.title), ["Voicemail → Email", "Summarize", "Draft Reply", "Custom"]);
  assert.equal(ext.actions({ text: "  " }, defaults(ext), ctx), undefined);
});

await run("request shape + replace paste, thinking blocks dropped", async () => {
  const ax = mockAxios(ok("Subject: Callback\n\nHi Dana,"));
  const { ext, calls } = load({ axios: ax });
  const opts = defaults(ext);
  await ext.actions(input, opts, ctx).submenu[0].code(input, opts, ctx);
  const { url, body, headers } = ax.sent[0];
  assert.equal(url, "https://api.anthropic.com/v1/messages");
  assert.equal(body.model, "claude-opus-5-5");
  assert.equal(body.fallbacks, "default");
  assert.equal(headers["anthropic-beta"], "server-side-fallback-2026-07-01");
  assert.deepEqual(body.output_config, { effort: "low" });
  assert.match(body.system, /voicemail transcript/);
  assert.match(body.messages[0].content, /^<selected_text>\nHi it's Dana/);
  assert.deepEqual(calls, [["paste", "Subject: Callback\n\nHi Dana,", { restore: true }]]);
});

await run("haiku gets no fallbacks", async () => {
  const ax = mockAxios(ok("x"));
  const { ext } = load({ axios: ax });
  const opts = defaults(ext, { model: "claude-haiku-5-5" });
  await ext.actions(input, opts, ctx).submenu[1].code(input, opts, ctx);
  assert.equal(ax.sent[0].body.fallbacks, undefined);
  assert.equal(ax.sent[0].headers["anthropic-beta"], undefined);
});

await run("option toggles to append, shift and no-paste copy", async () => {
  for (const [mods, c, expected] of [
    [{ option: true }, ctx, ["paste", `${input.text}\n\nR`, { restore: true }]],
    [{ shift: true }, ctx, ["copy", "R"]],
    [{}, { canPaste: false }, ["copy", "R"]],
  ]) {
    const { ext, calls } = load({ axios: mockAxios(ok("R")), modifiers: mods });
    const opts = defaults(ext);
    await ext.actions(input, opts, c).submenu[1].code(input, opts, c);
    assert.deepEqual(calls, [expected]);
  }
});

await run("errors: 401 opens settings, 400 and refusal are shown", async () => {
  const fail = (status, message) => () => {
    throw Object.assign(new Error("x"), { response: { status, data: { error: { message } } } });
  };
  let { ext, calls } = load({ axios: mockAxios(fail(401, "invalid x-api-key")) });
  let opts = defaults(ext);
  await assert.rejects(ext.actions(input, opts, ctx).submenu[1].code(input, opts, ctx), /^Error: Settings error: Claude API error 401/);

  ({ ext, calls } = load({ axios: mockAxios(fail(400, "bad model")) }));
  await ext.actions(input, opts, ctx).submenu[1].code(input, opts, ctx);
  assert.deepEqual(calls, [["show", "Claude API error 400: bad model"]]);

  ({ ext, calls } = load({ axios: mockAxios(ok("", { stop_reason: "refusal", content: [] })) }));
  await ext.actions(input, opts, ctx).submenu[1].code(input, opts, ctx);
  assert.deepEqual(calls, [["show", "Claude declined this request."]]);

  ({ ext } = load({ axios: mockAxios(ok("x")) }));
  opts = defaults(ext, { apikey: "" });
  await assert.rejects(ext.actions(input, opts, ctx).submenu[1].code(input, opts, ctx), /Settings error/);
});

if (process.env.ANTHROPIC_API_KEY) {
  await run("live: Voicemail → Email against the real API", async () => {
    const { ext, calls } = load({ axios: realAxios });
    const opts = defaults(ext);
    await ext.actions(input, opts, ctx).submenu[0].code(input, opts, ctx);
    assert.equal(calls[0][0], "paste", JSON.stringify(calls));
    console.log(`\n${calls[0][1]}\n`);
  });
} else {
  console.log("skip - live API test (set ANTHROPIC_API_KEY to run it)");
}
