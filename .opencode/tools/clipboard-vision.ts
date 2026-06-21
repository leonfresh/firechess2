import { tool } from "@opencode-ai/plugin"
import path from "path"
import fs from "fs"
import os from "os"
import { execSync } from "child_process"

export default tool({
  description:
    "CRITICAL: Use this tool when the user asks about an image in their clipboard, pastes an image, or says 'what's in my clipboard'. Reads the Windows clipboard image, saves to temp file, and analyzes via Gemini Vision API. Returns a text description of the image.",
  args: {
    prompt: tool.schema
      .string()
      .optional()
      .describe(
        "Optional specific question about the image. Default: analyze the image in full.",
      ),
  },
  async execute(args, context) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vision-"))
    const imagePath = path.join(tmpDir, "clipboard.png")

    // Write PowerShell script to a temp file to avoid quoting issues
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img -eq $null) { exit 1 }
$img.Save("${imagePath.replace(/\\/g, "\\\\")}")
$img.Dispose()
`
    const psFile = path.join(tmpDir, "save-clipboard.ps1")
    fs.writeFileSync(psFile, psScript, "utf-8")

    try {
      execSync(`powershell -NoProfile -File "${psFile}"`, { timeout: 10000 })
    } catch {
      fs.rmSync(tmpDir, { recursive: true, force: true })
      return "No image found in the clipboard. Copy or take a screenshot first, then try again."
    }

    if (!fs.existsSync(imagePath)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
      return "No image found in the clipboard. Copy or take a screenshot first, then try again."
    }

    // Call opencode-vision CLI to analyze (library reads GOOGLE_API_KEY)
    const pythonArgs = args.prompt
      ? `describe "${imagePath}" "${args.prompt}"`
      : `analyze "${imagePath}"`

    try {
      const stdout = execSync(`python -m opencode_vision ${pythonArgs}`, {
        timeout: 60000,
        env: {
          ...process.env,
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "",
          PYTHONIOENCODING: "utf-8",
        },
      })
      return stdout.toString().trim()
    } catch (e: any) {
      return `Vision analysis failed: ${e.stderr?.toString().trim() || e.message || "Unknown error"}`
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  },
})
