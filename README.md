# Pulse AI

A small browser-based AI called Pulse.

## What it does
- No API key
- Downloads its AI brain when you press "Download AI Brain"
- Uses browser cache so the model can be reused
- Takes photos
- Text chat
- Speech-to-text when the browser supports it
- Speaks responses with browser text-to-speech
- Optional Auto-talk mode

## Important
The download screen says approximately 300 MB. The real amount can differ because browser/model cache files and quantization can vary.

The model is `HuggingFaceTB/SmolVLM-256M-Instruct` in 4-bit mode. The model is fetched from Hugging Face by Transformers.js; it is not bundled into this ZIP.

For GitHub Pages:
1. Upload all files.
2. Make sure `index.html` is lowercase.
3. Enable GitHub Pages from the repository's Settings > Pages.
4. Open the generated Pages URL.
5. Press Download AI Brain.

The first download requires internet. Afterward the browser may reuse its cache, subject to browser storage rules.
