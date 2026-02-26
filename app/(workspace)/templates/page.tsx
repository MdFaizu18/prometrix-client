"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { TemplatesView } from "@/components/prometrix/templates-view"

export default function TemplatesPage() {
  const router = useRouter()

  const handleUseTemplate = useCallback(
    (prompt: string) => {
      const qs = new URLSearchParams({ prompt })
      router.push(`/new-prompt?${qs.toString()}`)
    },
    [router]
  )

  return <TemplatesView onUseTemplate={handleUseTemplate} />
}

