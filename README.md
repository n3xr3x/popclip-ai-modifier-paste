# AI Modifier Paste

A [PopClip](https://www.popclip.app) extension that runs the selected text through an AI model with a saved prompt and pastes the response. It works with the Claude API or any model on OpenRouter. User-facing docs: [AIModifierPaste.popclipext/readme.md](AIModifierPaste.popclipext/readme.md).

## Develop

```bash
npm install
npm run check   # type-check against PopClip's popclip.d.ts
npm test        # mocked PopClip + APIs; set ANTHROPIC_API_KEY and/or OPENROUTER_API_KEY for live calls
```

Install locally by double-clicking `AIModifierPaste.popclipext` (PopClip warns that it's unsigned).

## Publish to the PopClip directory

1. Install the PopClip Directory GitHub app on this repo (see https://www.popclip.app/extensions/submit).
2. Tag and push, e.g. `git tag v1.0 && git push origin main v1.0`.

The package path and the identifier `io.github.n3xr3x.ai-modifier-paste` can't change after the first submission.
