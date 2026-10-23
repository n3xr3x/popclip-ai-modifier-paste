// Loads an extension's Config.ts against mocked PopClip globals and a mocked
// (or real) axios.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export const realAxios = require("axios");

export function load(pkg, { axios, modifiers = {} }) {
  const src = readFileSync(new URL(`../${pkg}/Config.ts`, import.meta.url), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
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

export function defaults(ext, apikey, overrides = {}) {
  const o = {};
  for (const opt of ext.options) {
    if (opt.type !== "heading") o[opt.identifier] = opt.defaultValue ?? "";
  }
  return { ...o, apikey: apikey || "sk-test", ...overrides };
}

export function mockAxios(respond) {
  const sent = [];
  return {
    sent,
    post: async (url, body, cfg) => {
      sent.push({ url, body, headers: cfg.headers });
      return respond(body);
    },
  };
}

export const ctx = { canPaste: true };
export const input = { text: "Hi it's Dana from Acme, call me back at 555-0100 about the Tuesday order." };

export async function run(name, fn) {
  await fn();
  console.log(`ok - ${name}`);
}

