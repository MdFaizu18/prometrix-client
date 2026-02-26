"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api"

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
  initialToolMode?: string
  initialTechStack?: string[]
  selectedVersion?: Version | null
}

function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
  if (!match) return null
  return decodeURIComponent(match.split("=")[1] ?? "")
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
  
  
 
  { value: "technical", label: "Technical", desc: "Technically detailed, developer-focused, and precise" },
  { value: "concise", label: "Concise", desc: "Minimal, clear, and to the point" },
  { value: "creative", label: "Creative", desc: "Creative, imaginative, and open-ended" },
  { value: "casual", label: "Casual", desc: "Friendly, conversational, and approachable" },
  { value: "formal", label: "Formal", desc: "Professional, precise, and structured" },
]

export function EditorPanel({
  onNewVersion,
  versions,
  initialTitle,
  initialRawPrompt,
  initialToolMode,
  initialTechStack,
  selectedVersion,
}: EditorPanelProps) {
  const searchParams = useSearchParams()
  const [title, setTitle] = useState(initialTitle ?? "")
  const [rawPrompt, setRawPrompt] = useState(initialRawPrompt ?? "")
  const [toolMode, setToolMode] = useState(initialToolMode ?? "cursor")
  const [model, setModel] = useState("llama-3.3-70b-versatile")
  const [selectedTech, setSelectedTech] = useState<string[]>(
    initialTechStack && initialTechStack.length > 0 ? initialTechStack : [""]
  )
  const [tone, setTone] = useState("technical")
  const [refinedPrompt, setRefinedPrompt] = useState("")
  const [promptId, setPromptId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [copied, setCopied] = useState(false)
  const appliedInitialRef = useRef(false)
  const templateAppliedRef = useRef(false)

  useEffect(() => {
    if (appliedInitialRef.current) return
    if (!initialTitle && !initialRawPrompt) return

    setTitle((prev) => prev || initialTitle || "")
    setRawPrompt((prev) => prev || initialRawPrompt || "")
    appliedInitialRef.current = true
  }, [initialTitle, initialRawPrompt])

  // If templateId is present in URL, fetch that template and prefill the form
  useEffect(() => {
    if (templateAppliedRef.current) return
    const templateId = searchParams.get("templateId")
    if (!templateId) return

    const token = getAuthTokenFromCookie()
    if (!token) return

    const controller = new AbortController()

    async function loadTemplate() {
      try {
        const res = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) return

        const tpl = data?.data as
          | {
              name?: string
              basePrompt?: string
              toolMode?: string
              techStack?: string[]
            }
          | undefined

        if (!tpl) return

        setTitle(tpl.name || "")
        setRawPrompt(tpl.basePrompt || "")
        if (tpl.toolMode) setToolMode(tpl.toolMode)
        if (tpl.techStack && tpl.techStack.length > 0) {
          setSelectedTech(tpl.techStack)
        }

        templateAppliedRef.current = true
      } catch {
        // swallow errors; editor will just show defaults
      }
    }

    loadTemplate()

    return () => controller.abort()
  }, [searchParams])

  // When user selects a version in the side panel, show that prompt in preview
  useEffect(() => {
    if (!selectedVersion) return
    setRefinedPrompt(selectedVersion.prompt)
  }, [selectedVersion])

  const toggleTech = useCallback((tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech)
        ? prev.filter((t) => t !== tech)
        : [...prev, tech]
    )
  }, [])

  const handleClear = useCallback(() => {
    setTitle("")
    setRawPrompt("")
    setRefinedPrompt("")
    setPromptId(null)
  }, [])

  const submitPrompt = useCallback(async () => {
    if (!rawPrompt.trim()) {
      toast.error("Please write a prompt first")
      return
    }

    const token = getAuthTokenFromCookie()
    if (!token) {
      toast.error("You must be logged in to submit prompts")
      return
    }

    const apiTone =
      tone === "minimal"
        ? "concise"
        : tone === "structured" || tone === "strict" || tone === "detailed"
        ? "technical"
        : "technical"

    setIsSubmitting(true)

    try {
      const createBody = {
        title: title || "Untitled Prompt",
        description: "",
        rawPrompt,
        toolMode,
        model,
        techStack: selectedTech,
        tone: apiTone,
      }

      const url = promptId
        ? `${API_BASE_URL}/prompts/${promptId}`
        : `${API_BASE_URL}/prompts`

      const method = promptId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createBody),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.message || "Failed to submit prompt")
        return
      }

      const newId: string | undefined =
        data?.data?._id || data?.data?.promptId || data?.data?.id
      if (!newId && !promptId) {
        toast.error("Prompt saved but ID was not returned")
        return
      }

      if (newId) {
        setPromptId(newId)
      }

      toast.success(promptId ? "Prompt updated" : "Prompt submitted")
    } catch {
      toast.error("Something went wrong while submitting the prompt")
    } finally {
      setIsSubmitting(false)
    }
  }, [rawPrompt, title, toolMode, model, selectedTech, tone, promptId])

  const refinePrompt = useCallback(async () => {
    if (!promptId) {
      toast.error("Submit the prompt first before refining")
      return
    }

    const token = getAuthTokenFromCookie()
    if (!token) {
      toast.error("You must be logged in to refine prompts")
      return
    }

    setIsRefining(true)

    try {
      const refineRes = await fetch(`${API_BASE_URL}/prompts/${promptId}/refine`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const refineData = await refineRes.json().catch(() => null)
      if (!refineRes.ok) {
        toast.error(refineData?.message || "Failed to refine prompt")
        return
      }

      const version = refineData?.data
      const refined = version?.refinedPrompt as string | undefined

      if (!refined) {
        toast.error("Refine API returned no refined prompt")
        return
      }

      setRefinedPrompt(refined)

      const versionNum: number =
        typeof version?.versionNumber === "number" ? version.versionNumber : versions.length + 1
      const labels = ["Raw", "Structured", "Optimized", "Refined", "Enhanced"]
      const clarityScore =
        typeof version?.score?.clarity === "number" ? version.score.clarity : Math.min(6 + versionNum, 10)
      const structureScore =
        typeof version?.score?.specificity === "number"
          ? version.score.specificity
          : Math.min(7 + versionNum, 10)
      const overallScore =
        typeof version?.score?.overall === "number" ? version.score.overall : (clarityScore + structureScore) / 2

      const newVersion: Version = {
        id: versionNum,
        label: labels[Math.min(versionNum - 1, labels.length - 1)],
        prompt: refined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        scores: {
          clarity: clarityScore,
          structure: structureScore,
          ambiguity:
            overallScore >= 7
              ? "Low"
              : overallScore >= 4
              ? "Medium"
              : "High",
        },
      }

      onNewVersion(newVersion)
      toast.success(`Version ${versionNum} generated successfully`)
    } catch {
      toast.error("Something went wrong while refining the prompt")
    } finally {
      setIsRefining(false)
    }
  }, [promptId, versions.length, onNewVersion])

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
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleClear}
          >
            Clear
          </Button>
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
                    <SelectItem value="claude">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-chart-3" />
                        Claude
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

          {/* Submit & Refine Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!promptId ? (
              <>
                <Button
                  onClick={submitPrompt}
                  disabled={isSubmitting || !title.trim() || !rawPrompt.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-6 py-2.5 font-medium shadow-lg shadow-primary/20 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>Submit Prompt</>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Fill in the details and submit your prompt to start creating versions.
                </span>
              </>
            ) : (
              <>
                <Button
                  onClick={refinePrompt}
                  disabled={isRefining}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-6 py-2.5 font-medium shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
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
                  You can refine this prompt multiple times to generate more versions.
                </span>
              </>
            )}
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
                    v{selectedVersion?.id ?? versions.length}
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
