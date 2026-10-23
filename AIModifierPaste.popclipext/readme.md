# AI Modifier Paste

Select text, pick one of your saved prompts, and the AI's response is pasted in place of the selection. Use the Claude API directly, or any model on [OpenRouter](https://openrouter.ai).

For example, select a voicemail transcript, choose **Voicemail → Email**, and a ready-to-send follow-up email replaces the transcript.

## Setup

1. Choose a **Provider** in the extension's settings: **Claude API (Anthropic)** or **OpenRouter**.
2. Add that provider's API key:
   - Claude API: create a key in the [Claude Console](https://console.anthropic.com/settings/keys).
   - OpenRouter: create a key on the [OpenRouter keys page](https://openrouter.ai/settings/keys), and add credits to your account.

You can add both keys and switch between providers at any time.

## Saved prompts

The extension has eight prompt slots. Each slot has a **Name** (the button title) and a **Prompt** (the instruction the model follows). Four come filled in:

- **Voicemail → Email**: turns a voicemail transcript into a follow-up email with a subject line.
- **Polish**: fixes grammar and spelling while keeping your voice.
- **Summarize**: 3–5 bullet points.
- **Draft Reply**: writes your reply to a message you received.

Edit any of them, or fill an empty slot to add your own. Clear a slot's name to hide it.

## Options

- **Provider**: which service handles requests.
- **Claude API → Model**: Claude Opus 5.5 (default), Sonnet 5.5, or Haiku 5.5. Choose **Other** to enter any Claude model ID.
- **OpenRouter → Model**: Claude Opus 5.5 (default), Claude Sonnet 5.5, GPT-6.1 Sol, Gemini 4 Argon, or DeepSeek V4.1 Flash. Choose **Other** to enter any model ID from the [models list](https://openrouter.ai/models).
- **Effort**: how much the model reasons first, for models that support it. Low is fastest and suits most rewrites. Reasoning is never pasted.
- **Response Handling**: replace the selection, paste after it, or copy to the clipboard.
- **Popup Layout**: one **AI** button that opens a menu of your prompts, or a separate button per prompt.

## Modifier keys

Hold a key while clicking a prompt:

- **⌥ Option**: switch between replacing the selection and pasting after it.
- **⇧ Shift**: copy the response instead of pasting.
- **⌃ Control**: use the other provider for this request.

When the app you're in can't paste (for example, read-only text in a browser), the response is copied to the clipboard.

## Privacy

Nothing is sent until you click a prompt. Then the selected text and that prompt are sent, using your own API key, to the provider in use:

- **Claude API**: sent to Anthropic (`api.anthropic.com`). See Anthropic's [privacy policy](https://www.anthropic.com/legal/privacy).
- **OpenRouter**: sent to OpenRouter (`openrouter.ai`), which forwards them to the company behind the model you chose (for example Anthropic, OpenAI or Google). See OpenRouter's [privacy policy](https://openrouter.ai/privacy) and its [data policy settings](https://openrouter.ai/settings/privacy), which control which providers may receive your requests.

Nothing is sent anywhere else. API keys are stored in the macOS keychain.

## Changelog

- 1.0: First release.
