# popclip-claude

A [PopClip](https://www.popclip.app) extension that runs the selected text through Claude with a saved prompt and pastes the response. User-facing docs: [ClaudePrompts.popclipext/readme.md](ClaudePrompts.popclipext/readme.md).

## Develop

```bash
npm install
npm run check   # type-check against PopClip's popclip.d.ts
npm test        # mocked PopClip + API; set ANTHROPIC_API_KEY for a live call too
```

Install locally by double-clicking `ClaudePrompts.popclipext` (PopClip warns that it's unsigned).

## Publish to the PopClip directory

1. Push this repo to a public GitHub repository.
2. Install the PopClip Directory GitHub app on it (see https://www.popclip.app/extensions/submit).
3. Tag and push, e.g. `git tag v1.0 && git push origin main v1.0`.
