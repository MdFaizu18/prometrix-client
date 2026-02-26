"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Globe, Lock, Plus, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api"

interface Template {
  _id: string
  name: string
  category?: string
  basePrompt: string
  toolMode?: string
  techStack?: string[]
  isPublic: boolean
  createdBy?: {
    _id: string
    name: string
  }
}

function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
  if (!match) return null
  return decodeURIComponent(match.split("=")[1] ?? "")
}

export function TemplatesView() {
  const [myTemplates, setMyTemplates] = useState<Template[]>([])
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([])
  const [loadingMy, setLoadingMy] = useState(false)
  const [loadingPublic, setLoadingPublic] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState<"public" | "my">("public")

  const [searchTerm, setSearchTerm] = useState("")
  const [toolFilter, setToolFilter] = useState<"all" | "cursor" | "v0" | "generic" | "claude">("all")

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [basePrompt, setBasePrompt] = useState("")
  const [toolMode, setToolMode] = useState<string>("generic")
  const [techStackInput, setTechStackInput] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const router = useRouter()
  const token = useMemo(() => getAuthTokenFromCookie(), [])

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredMyTemplates = useMemo(() => {
    return myTemplates.filter((t) => {
      if (toolFilter !== "all" && t.toolMode && t.toolMode !== toolFilter) {
        return false
      }
      if (!normalizedSearch) return true

      const haystack = [
        t.name,
        t.category,
        t.basePrompt,
        t.toolMode,
        t.techStack?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [myTemplates, normalizedSearch, toolFilter])

  const filteredPublicTemplates = useMemo(() => {
    return publicTemplates.filter((t) => {
      if (toolFilter !== "all" && t.toolMode && t.toolMode !== toolFilter) {
        return false
      }
      if (!normalizedSearch) return true

      const haystack = [
        t.name,
        t.category,
        t.basePrompt,
        t.toolMode,
        t.techStack?.join(" "),
        t.createdBy?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [publicTemplates, normalizedSearch, toolFilter])

  useEffect(() => {
    if (!token) return

    const loadMyTemplates = async () => {
      setLoadingMy(true)
      try {
        const res = await fetch(`${API_BASE_URL}/templates/my`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setMyTemplates([])
          return
        }
        setMyTemplates(data?.data ?? [])
      } catch {
        setMyTemplates([])
      } finally {
        setLoadingMy(false)
      }
    }

    const loadPublicTemplates = async () => {
      setLoadingPublic(true)
      try {
        const res = await fetch(`${API_BASE_URL}/templates/public`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setPublicTemplates([])
          return
        }
        setPublicTemplates(data?.data ?? [])
      } catch {
        setPublicTemplates([])
      } finally {
        setLoadingPublic(false)
      }
    }

    loadMyTemplates()
    loadPublicTemplates()
  }, [token])

  const handleCreateTemplate = async () => {
    if (!token) {
      toast.error("You must be logged in to create templates.")
      return
    }

    if (!name.trim() || !basePrompt.trim()) {
      toast.error("Name and base prompt are required.")
      return
    }

    setCreating(true)
    try {
      const techStack =
        techStackInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? []

      const body = {
        name: name.trim(),
        category: category.trim() || undefined,
        basePrompt: basePrompt.trim(),
        toolMode: toolMode || undefined,
        techStack,
        isPublic,
      }

      const res = await fetch(`${API_BASE_URL}/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.message || "Failed to create template.")
        return
      }

      toast.success("Template created.")

      const created: Template | null = data?.data ?? null
      if (created) {
        setMyTemplates((prev) => [created, ...prev])
        if (created.isPublic) {
          setPublicTemplates((prev) => [created, ...prev])
        }
      }

      // Reset form
      setName("")
      setCategory("")
      setBasePrompt("")
      setToolMode("generic")
      setTechStackInput("")
      setIsPublic(true)
    } catch {
      toast.error("Unable to create template. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const handleOpenTemplate = async (templateId: string) => {
    if (!token) {
      toast.error("You must be logged in to view templates.")
      return
    }

    setPreviewLoading(true)
    setPreviewTemplate(null)
    setPreviewOpen(true)

    try {
      const res = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.message || "Failed to load template.")
        setPreviewOpen(false)
        return
      }
      setPreviewTemplate(data?.data ?? null)
    } catch {
      toast.error("Unable to load template. Please try again.")
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleCopyBasePrompt = async () => {
    if (!previewTemplate?.basePrompt) return
    try {
      await navigator.clipboard.writeText(previewTemplate.basePrompt)
      toast.success("Base prompt copied to clipboard")
    } catch {
      toast.error("Failed to copy base prompt")
    }
  }

  const handleOpenInEditor = () => {
    if (!previewTemplate) return
    const qs = new URLSearchParams()
    qs.set("templateId", previewTemplate._id)
    setPreviewOpen(false)
    router.push(`/new-prompt?${qs.toString()}`)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Prompt Templates</h1>
          <p className="text-sm text-muted-foreground">
            Save your favorite prompts as reusable templates and discover public ones.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          <Plus className="size-4" />
          {showCreateForm ? "Close" : "New template"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* New template form (shown on demand) */}
        {showCreateForm && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-medium text-foreground">
              New template
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="React Component Generator"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="frontend, backend, ops..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Base prompt</label>
              <Textarea
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                rows={3}
                placeholder="Create a React component that {{description}}. Use TypeScript and Tailwind CSS."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tool mode</label>
                <Select value={toolMode} onValueChange={setToolMode}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cursor">Cursor</SelectItem>
                    <SelectItem value="v0">v0</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground">
                  Tech stack (comma separated)
                </label>
                <Input
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="React, TypeScript, Tailwind"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="isPublic"
                checked={isPublic}
                onCheckedChange={(v) => setIsPublic(Boolean(v))}
              />
              <label htmlFor="isPublic" className="text-xs text-muted-foreground flex items-center gap-1.5">
                {isPublic ? (
                  <>
                    <Globe className="size-3" />
                    Public template (others can use it)
                  </>
                ) : (
                  <>
                    <Lock className="size-3" />
                    Private template (only you)
                  </>
                )}
              </label>
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                className="gap-2"
                onClick={handleCreateTemplate}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create template"}
              </Button>
            </div>
          </div>
        )}

        {/* Search, filter, and view toggle */}
        <div className="mb-4 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, category, description, tool or tech..."
              className="h-8 text-xs"
            />
            <Select
              value={toolFilter}
              onValueChange={(v: "all" | "cursor" | "v0" | "generic") => setToolFilter(v)}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tools</SelectItem>
                <SelectItem value="cursor">Cursor</SelectItem>
                <SelectItem value="v0">v0</SelectItem>
                <SelectItem value="generic">Generic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">View:</span>
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              <button
                type="button"
                className={cn(
                  "rounded px-3 py-1 text-xs",
                  activeTab === "public"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
                onClick={() => setActiveTab("public")}
              >
                Public
              </button>
              <button
                type="button"
                className={cn(
                  "rounded px-3 py-1 text-xs",
                  activeTab === "my"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
                onClick={() => setActiveTab("my")}
              >
                My
              </button>
            </div>
          </div>
        </div>

        {activeTab === "my" ? (
          // My templates
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">
                My templates
              </p>
              {loadingMy && (
                <p className="text-[11px] text-muted-foreground">Loading...</p>
              )}
            </div>
            {filteredMyTemplates.length === 0 && !loadingMy ? (
              <p className="text-xs text-muted-foreground">
                No templates found. Try adjusting your search or filters.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMyTemplates.map((t) => (
                  <div
                    key={t._id}
                    className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-accent/30"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {t.name}
                      </h3>
                      <Badge variant="secondary" className="text-[9px] font-normal">
                        {t.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                    {t.category && (
                      <p className="mb-1 text-[11px] text-muted-foreground">
                        {t.category}
                      </p>
                    )}
                    <p className="mb-3 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {t.basePrompt}
                    </p>
                    {t.techStack && t.techStack.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {t.techStack.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-xs text-muted-foreground hover:text-primary"
                      onClick={() => handleOpenTemplate(t._id)}
                    >
                      Use template
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Public templates
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">
                Public templates
              </p>
              {loadingPublic && (
                <p className="text-[11px] text-muted-foreground">Loading...</p>
              )}
            </div>
            {filteredPublicTemplates.length === 0 && !loadingPublic ? (
              <p className="text-xs text-muted-foreground">
                No public templates found. Try adjusting your search or filters.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPublicTemplates.map((t) => (
                  <div
                    key={t._id}
                    className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-accent/30"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {t.name}
                      </h3>
                      <Badge variant="secondary" className="text-[9px] font-normal">
                        Public
                      </Badge>
                    </div>
                    <p className="mb-1 text-[11px] text-muted-foreground">
                      By {t.createdBy?.name || "Unknown"}
                    </p>
                    {t.category && (
                      <p className="mb-1 text-[11px] text-muted-foreground">
                        {t.category}
                      </p>
                    )}
                    <p className="mb-3 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {t.basePrompt}
                    </p>
                    {t.techStack && t.techStack.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {t.techStack.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-xs text-muted-foreground hover:text-primary"
                      onClick={() => handleOpenTemplate(t._id)}
                    >
                      Use template
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {previewTemplate?.name || "Template preview"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review the template details, copy the base prompt, or open it in the editor.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] overflow-y-auto pr-1">
              {previewLoading ? (
                <p className="text-xs text-muted-foreground">Loading template...</p>
              ) : !previewTemplate ? (
                <p className="text-xs text-muted-foreground">
                  Unable to load template details.
                </p>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {previewTemplate.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {previewTemplate.category}
                      </Badge>
                    )}
                    {previewTemplate.toolMode && (
                      <Badge variant="outline" className="text-[10px]">
                        Tool: {previewTemplate.toolMode}
                      </Badge>
                    )}
                    {previewTemplate.techStack && previewTemplate.techStack.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        Tech: {previewTemplate.techStack.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-foreground">Base prompt</p>
                    <div className="relative">
                      <Textarea
                        value={previewTemplate.basePrompt}
                        readOnly
                        rows={6}
                        className="text-xs pr-10"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 size-7 text-muted-foreground hover:text-foreground"
                        onClick={handleCopyBasePrompt}
                      >
                        <Copy className="size-3.5" />
                        <span className="sr-only">Copy base prompt</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-2 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleCopyBasePrompt}
                disabled={!previewTemplate?.basePrompt}
              >
                <Copy className="mr-1 size-3" />
                Copy prompt
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs"
                onClick={handleOpenInEditor}
                disabled={!previewTemplate}
              >
                Open in editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
