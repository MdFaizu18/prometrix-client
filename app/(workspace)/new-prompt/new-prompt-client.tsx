"use client"

import { useCallback, useState } from "react"
import { EditorPanel } from "@/components/prometrix/editor-panel"
import { VersionPanel } from "@/components/prometrix/version-panel"

interface Version {
  id: number
  label: string
  prompt: string
  timestamp: string
  scores: { clarity: number; structure: number; ambiguity: string }
}

export default function NewPromptClient({
  initialTitle,
  initialPrompt,
}: {
  initialTitle: string
  initialPrompt: string
}) {
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)

  const handleNewVersion = useCallback((version: Version) => {
    setVersions((prev) => [...prev, version])
    setSelectedVersion(version)
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <EditorPanel
          onNewVersion={handleNewVersion}
          versions={versions}
          initialTitle={initialTitle}
          initialRawPrompt={initialPrompt}
        />
      </div>

      <div className="hidden w-72 lg:block">
        <VersionPanel
          versions={versions}
          selectedVersion={selectedVersion}
          onSelectVersion={setSelectedVersion}
        />
      </div>
    </div>
  )
}

