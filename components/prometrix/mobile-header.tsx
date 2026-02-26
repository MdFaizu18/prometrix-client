"use client"

import { Sparkles, Menu, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MobileHeaderProps {
  onToggleSidebar: () => void
  onToggleVersions: () => void
  versionCount: number
}

export function MobileHeader({ onToggleSidebar, onToggleVersions, versionCount }: MobileHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="size-9 text-muted-foreground hover:text-foreground"
      >
        <Menu className="size-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="size-3.5 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">
          Prometrix
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleVersions}
        className="size-9 text-muted-foreground hover:text-foreground"
      >
        <GitBranch className="size-5" />
        {versionCount > 0 && (
          <Badge className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[9px]">
            {versionCount}
          </Badge>
        )}
        <span className="sr-only">Toggle versions</span>
      </Button>
    </header>
  )
}
