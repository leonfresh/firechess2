# Project Tools

## Clipboard Vision (`clipboard-vision`)
A custom opencode tool that reads images from the Windows clipboard and describes them using AI vision.

**How to use:** When the user asks "what's in my clipboard?" or pastes an image, call the `clipboard-vision` tool. It saves the clipboard image to a temp file and analyzes it via the Gemini Vision API.

If the `clipboard-vision` tool is not available, fall back to running the script directly:
```powershell
scripts\clipboard-vision.ps1
```

**Prerequisites:** `opencode-vision` Python package (`pip install opencode-vision`) installed globally, `GOOGLE_API_KEY` set as Windows user environment variable.

**MCP tools also available:** `vision_describe`, `vision_ocr`, and `vision_analyze` (accept `image_path` parameter — requires saving the image to disk first).
