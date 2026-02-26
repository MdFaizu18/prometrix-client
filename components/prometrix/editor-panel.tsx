"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Wand2,
  Copy,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

interface Version {
  id: number
  label: string
  prompt: string
  timestamp: string
  scores: { clarity: number; structure: number; ambiguity: string }
}

interface EditorPanelProps {
  onNewVersion: (version: Version) => void
  versions: Version[]
  initialTitle?: string
  initialRawPrompt?: string
}

// Minimal markdown-to-HTML converter for previewing refined prompts.
// Supports headings (#, ##, ###), bold (**text**), and basic line breaks.
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Headings
  html = html.replace(/^### (.*)$/gim, "<h3>$1</h3>")
  html = html.replace(/^## (.*)$/gim, "<h2>$1</h2>")
  html = html.replace(/^# (.*)$/gim, "<h1>$1</h1>")

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")

  // Horizontal rules
  html = html.replace(/^---$/gim, "<hr />")

  // Line breaks
  html = html.replace(/\n/g, "<br />")

  return html.trim()
}

// Strip basic markdown syntax to get a plain-text representation
// that matches the visual preview (no ##, **, etc.).
function markdownToPlainText(markdown: string): string {
  let text = markdown

  // Remove heading markers but keep the text
  text = text.replace(/^#{1,6}\s+/gim, "")

  // Replace bold/italic markers with plain text
  text = text.replace(/\*\*(.*?)\*\*/gim, "$1")
  text = text.replace(/\*(.*?)\*/gim, "$1")
  text = text.replace(/__(.*?)__/gim, "$1")
  text = text.replace(/_(.*?)_/gim, "$1")

  // Remove horizontal rule lines
  text = text.replace(/^---$/gim, "")

  // Trim trailing spaces on each line
  text = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")

  return text.trim()
}

const techStackOptions = [
  "React", "Next.js", "Node.js", "Express", "MongoDB",
  "PostgreSQL", "TypeScript", "Tailwind CSS", "Python", "Go",
  "Prisma", "GraphQL",
]

const toneOptions = [
  { value: "strict", label: "Strict", desc: "Rigid, rule-heavy output" },
  { value: "structured", label: "Structured", desc: "Organized, clear sections" },
  { value: "minimal", label: "Minimal", desc: "Concise, to-the-point" },
  { value: "detailed", label: "Detailed", desc: "Thorough, exhaustive" },
]

export function EditorPanel({
  onNewVersion,
  versions,
  initialTitle,
  initialRawPrompt,
}: EditorPanelProps) {
  const [title, setTitle] = useState(initialTitle ?? "")
  const [rawPrompt, setRawPrompt] = useState(initialRawPrompt ?? "")
  const [toolMode, setToolMode] = useState("cursor")
  const [model, setModel] = useState("llama-3.3-70b-versatile")
  const [selectedTech, setSelectedTech] = useState<string[]>(["React", "TypeScript"])
  const [tone, setTone] = useState("structured")
  const [refinedPrompt, setRefinedPrompt] = useState("")
  const [isRefining, setIsRefining] = useState(false)
  const [copied, setCopied] = useState(false)
  const appliedInitialRef = useRef(false)

  useEffect(() => {
    if (appliedInitialRef.current) return
    if (!initialTitle && !initialRawPrompt) return

    setTitle((prev) => prev || initialTitle || "")
    setRawPrompt((prev) => prev || initialRawPrompt || "")
    appliedInitialRef.current = true
  }, [initialTitle, initialRawPrompt])

  const toggleTech = useCallback((tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech)
        ? prev.filter((t) => t !== tech)
        : [...prev, tech]
    )
  }, [])

  const refinePrompt = useCallback(async () => {
    if (!rawPrompt.trim()) {
      toast.error("Please write a prompt first")
      return
    }

    setIsRefining(true)

    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 1500))

    const toneLabel = toneOptions.find((t) => t.value === tone)?.label ?? "Structured"
    const modeLabel = toolMode === "cursor" ? "Cursor" : toolMode === "v0" ? "v0" : "Generic"
    const techList = selectedTech.join(", ")

    const refined = `## ${title || "Untitled Prompt"}\n\n**Target Tool:** ${modeLabel}\n**Tech Stack:** ${techList}\n**Tone:** ${toneLabel}\n\n---\n\n### Instructions\n\nYou are an expert developer working with ${techList}. Follow ${toneLabel.toLowerCase()} guidelines.\n\n${rawPrompt}\n\n### Constraints\n\n- Use best practices for ${techList}\n- Follow ${toneLabel.toLowerCase()} output format\n- Ensure production-ready code quality\n- Include proper error handling and type safety`

    setRefinedPrompt(refined)

    const versionNum = versions.length + 1
    const labels = ["Raw", "Structured", "Optimized", "Refined", "Enhanced"]
    const newVersion: Version = {
      id: versionNum,
      label: labels[Math.min(versionNum - 1, labels.length - 1)],
      prompt: refined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      scores: {
        clarity: Math.min(6 + versionNum, 10),
        structure: Math.min(7 + versionNum, 10),
        ambiguity: versionNum >= 3 ? "Low" : versionNum >= 2 ? "Medium" : "High",
      },
    }

    onNewVersion(newVersion)
    setIsRefining(false)
    toast.success(`Version ${versionNum} generated successfully`)
  }, [rawPrompt, title, toolMode, selectedTech, tone, versions.length, onNewVersion])

  const copyToClipboard = useCallback(async () => {
    const plain = markdownToPlainText(refinedPrompt)
    await navigator.clipboard.writeText(plain)
    setCopied(true)
    toast.success("Preview text copied")
    setTimeout(() => setCopied(false), 2000)
  }, [refinedPrompt])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Prompt Editor</h1>
          <p className="text-sm text-muted-foreground">
            Craft and refine your AI prompts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs font-normal text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Ready
          </Badge>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-title" className="text-sm font-medium text-foreground">
              Prompt Title
            </label>
            <input
              id="prompt-title"
              type="text"
              placeholder="e.g., Build an authentication system"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Raw Prompt */}
          <div className="space-y-1.5">
            <label htmlFor="raw-prompt" className="text-sm font-medium text-foreground">
              Raw Prompt
            </label>
            <textarea
              id="raw-prompt"
              placeholder="Describe what you want the AI to build or do..."
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              rows={6}
              className="w-full resize-y rounded-lg border border-border bg-secondary px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              {rawPrompt.length} characters
            </p>
          </div>

          {/* Configuration Row */}
          <div className="grid gap-4 sm:grid-cols-3">
           {/* Model Selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Model
              </label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama-3.3-70b-versatile">
                    <div className="flex items-center gap-2">
                      {/* <span className="size-2 rounded-full bg-chart-2" /> */}
                     Llama 3.3 70B <span className="text-xs text-muted-foreground">(default)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="qwen/qwen3-32b">
                    <div className="flex items-center gap-2">
                      {/* <span className="size-2 rounded-full bg-primary" /> */}
                      Qwen 3.3 32B
                    </div>
                  </SelectItem>
                  <SelectItem value="groq/compound">
                    <div className="flex items-center gap-2">
                      {/* <span className="size-2 rounded-full bg-muted-foreground" /> */}
                      Groq Compound
                    </div>
                  </SelectItem>
                  <SelectItem value="openai/gpt-oss-120b">
                    <div className="flex items-center gap-2">
                      {/* <span className="size-2 rounded-full bg-muted-foreground" /> */}
                      GPT-OSS 120B
                    </div>
                  </SelectItem>
                  <SelectItem value="whisper-large-v3-turbo">
                    <div className="flex items-center gap-2">
                      {/* <span className="size-2 rounded-full bg-muted-foreground" /> */}
                      Whisper Large V3 Turbo
                    </div>
                  </SelectItem>
                  <SelectItem value="moonshotai/kimi-k2-instruct-0905">
                    <div className="flex items-center gap-2">
                      {/* <span className="size-2 rounded-full bg-muted-foreground" /> */}
                      Kimi K2 Instruct 0905
                    </div>
                  </SelectItem>
                  <SelectItem value="openai/gpt-oss-safeguard-20b">
                    <div className="flex items-center gap-2">
                      {/* <span className="size-2 rounded-full bg-muted-foreground" /> */}
                      GPT-OSS Safeguard 20B
                    </div>
                  </SelectItem>
                
                </SelectContent>
              </Select>
            </div>


            {/* Tool Mode */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tool Mode
              </label>
              <Select value={toolMode} onValueChange={setToolMode}>
                <SelectTrigger className="w-full bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cursor">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-chart-2" />
                      Cursor
                    </div>
                  </SelectItem>
                  <SelectItem value="v0">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      v0
                    </div>
                  </SelectItem>
                  <SelectItem value="generic">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-muted-foreground" />
                      Generic
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tone
              </label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex flex-col">
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2.5">
            <label className="text-sm font-medium text-foreground">
              Tech Stack
            </label>
            <div className="flex flex-wrap gap-2">
              {techStackOptions.map((tech) => {
                const isSelected = selectedTech.includes(tech)
                return (
                  <button
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                      isSelected
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {tech}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Refine Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={refinePrompt}
              disabled={isRefining || !rawPrompt.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-6 py-2.5 font-medium shadow-lg shadow-primary/20 transition-all"
            >
              {isRefining ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Wand2 className="size-4" />
                  Refine Prompt
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              AI will optimize your prompt for {toolMode === "cursor" ? "Cursor" : toolMode === "v0" ? "v0" : "general"} use
            </span>
          </div>

          {/* Refined Output */}
          {refinedPrompt && (
            <div className="space-y-2 rounded-xl border border-border bg-card p-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-success" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Refined Output
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    v{versions.length}
                  </Badge>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="size-8 text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-success" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      <span className="sr-only">Copy refined prompt</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to clipboard</TooltipContent>
                </Tooltip>
              </div>
              <div
                className="rounded-lg bg-secondary p-4 text-xs leading-relaxed text-foreground/90"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(refinedPrompt) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
