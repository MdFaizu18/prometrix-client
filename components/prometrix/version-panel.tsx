"use client"

import { useState } from "react"
import {
  GitBranch,
  Eye,
  X,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface Version {
  id: number
  label: string
  prompt: string
  timestamp: string
  scores: { clarity: number; structure: number; ambiguity: string }
}

interface VersionPanelProps {
  versions: Version[]
  selectedVersion: Version | null
  onSelectVersion: (v: Version | null) => void
}

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const percentage = (value / 10) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3" />
          {label}
        </span>
        <span className="font-mono text-xs font-medium text-foreground">
          {value}/10
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  )
}

function AmbiguityBadge({ level }: { level: string }) {
  const config = {
    Low: { color: "text-success border-success/30 bg-success/10", label: "Low Risk" },
    Medium: { color: "text-warning border-warning/30 bg-warning/10", label: "Medium Risk" },
    High: { color: "text-destructive border-destructive/30 bg-destructive/10", label: "High Risk" },
  }
  const c = config[level as keyof typeof config] ?? config.Medium
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium", c.color)}>
      <AlertTriangle className="size-2.5" />
      {c.label}
    </span>
  )
}

export function VersionPanel({
  versions,
  selectedVersion,
  onSelectVersion,
}: VersionPanelProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleSelect = (v: Version) => {
    onSelectVersion(v)
    setPreviewOpen(true)
  }

  return (
    <aside className="flex h-full flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <GitBranch className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Versions</h2>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {versions.length}
        </Badge>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-secondary">
              <GitBranch className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No versions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Refine a prompt to create your first version
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {versions.map((v) => {
              const isSelected = selectedVersion?.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => handleSelect(v)}
                  className={cn(
                    "group flex w-full flex-col gap-1.5 rounded-lg border p-3 text-left transition-all duration-150",
                    isSelected
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent hover:border-border hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        v{v.id}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {v.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {v.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Clarity: {v.scores.clarity}/10
                    </span>
                    <span className="text-muted-foreground/30">|</span>
                    <AmbiguityBadge level={v.scores.ambiguity} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Score Preview */}
      {selectedVersion && previewOpen && (
        <div className="border-t border-border animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Eye className="size-3" />
              v{selectedVersion.id} Scores
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setPreviewOpen(false)
                onSelectVersion(null)
              }}
            >
              <X className="size-3" />
              <span className="sr-only">Close preview</span>
            </Button>
          </div>

          <div className="space-y-3 px-4 pb-4">
            <ScoreBar
              label="Clarity"
              value={selectedVersion.scores.clarity}
              icon={TrendingUp}
            />
            <ScoreBar
              label="Structure"
              value={selectedVersion.scores.structure}
              icon={ShieldCheck}
            />
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="size-3" />
                Ambiguity
              </span>
              <AmbiguityBadge level={selectedVersion.scores.ambiguity} />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
