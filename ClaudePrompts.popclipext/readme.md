# Claude Prompts

Select text, pick one of your saved prompts, and Claude's response is pasted in place of the selection.

For example, select a voicemail transcript, choose **Voicemail → Email**, and a ready-to-send follow-up email replaces the transcript.

## Setup

1. Create an API key in the [Claude Console](https://console.anthropic.com/settings/keys).
2. Open the extension's settings in PopClip and paste the key into **API Key**.

## Saved prompts

The extension has eight prompt slots. Each slot has a **Name** (the button title) and a **Prompt** (the instruction Claude follows). Four come filled in:

- **Voicemail → Email**: turns a voicemail transcript into a follow-up email with a subject line.
- **Polish**: fixes grammar and spelling while keeping your voice.
- **Summarize**: 3–5 bullet points.
- **Draft Reply**: writes your reply to a message you received.

Edit any of them, or fill an empty slot to add your own. Clear a slot's name to hide it.

## Options

- **Model**: Claude Opus 5.5 (default), Sonnet 5.5, or Haiku 5.5. You can also type any other model ID.
- **Effort**: how much Claude thinks first. Low is fastest and suits most rewrites.
- **Response Handling**: replace the selection, paste after it, or copy to the clipboard.
- **Popup Layout**: one **Claude** button that opens a menu of your prompts, or a separate button per prompt.

## Modifier keys

- Hold **⌥ Option** when clicking to switch between replacing the selection and pasting after it.
- Hold **⇧ Shift** to copy the response instead of pasting.

When the app you're in can't paste (for example, read-only text in a browser), the response is copied to the clipboard.

## Privacy

When you click a prompt, the selected text and that prompt are sent to Anthropic's Claude API (`api.anthropic.com`) using your own API key. Nothing is sent anywhere else, and nothing is sent until you click. Your API key is stored in the macOS keychain. Anthropic's handling of API data is described in its [privacy policy](https://www.anthropic.com/legal/privacy).

## Changelog

- 1.0: First release.
