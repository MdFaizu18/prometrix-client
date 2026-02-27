"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ApiHistoryItem {
  _id: string
  title: string
  description?: string
  rawPrompt?: string
  currentVersion?: {
    _id: string
    versionNumber: number
    refinedPrompt?: string
    createdAt?: string
  }
  toolMode?: string
  versionCount?: number
  createdAt?: string
  updatedAt?: string
}

interface HistoryItem {
  id: string
  title: string
  preview: string
  createdAt: string
  toolMode: string
  versions: number
  refinedPrompt?: string
  rawPrompt?: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://prometrix-server.vercel.app/api"
const PAGE_SIZE = 10

function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
  if (!match) return null
  return decodeURIComponent(match.split("=")[1] ?? "")
}

function formatDate(dateString: string) {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString()
}

export function HistoryView() {
  const router = useRouter()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(
    async (pageNumber: number) => {
      const token = getAuthTokenFromCookie()
      if (!token) {
        setError("Please log in to view your prompt history.")
        setItems([])
        setPagination(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const url = new URL(`${API_BASE_URL}/prompts/my`)
        url.searchParams.set("page", String(pageNumber))
        url.searchParams.set("limit", String(PAGE_SIZE))

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          const message = data?.message || "Failed to load prompt history."
          setError(message)
          setItems([])
          setPagination(null)
          return
        }

        const apiHistory: ApiHistoryItem[] = data?.data?.history ?? []
        const pageInfo: Pagination | null = data?.data?.pagination ?? null

        const mapped: HistoryItem[] = apiHistory.map((h) => ({
          id: h._id,
          title: h.title,
          preview: h.description || h.rawPrompt || "",
          createdAt: h.updatedAt || h.createdAt || "",
          toolMode: h.toolMode || "Cursor",
          versions: h.versionCount ?? 1,
          refinedPrompt: h.currentVersion?.refinedPrompt,
          rawPrompt: h.rawPrompt,
        }))

        setItems(mapped)
        if (pageInfo) {
          setPagination(pageInfo)
        } else {
          setPagination({
            total: mapped.length,
            page: pageNumber,
            limit: PAGE_SIZE,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          })
        }
      } catch (err) {
        setError("Unable to load history. Please try again.")
        setItems([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchHistory(page)
  }, [fetchHistory, page])

  const handleOpen = (item: HistoryItem) => {
    const params = new URLSearchParams()
    if (item.title) params.set("title", item.title)
    const prompt = item.refinedPrompt || item.rawPrompt || ""
    if (prompt) params.set("prompt", prompt)
    router.push(`/new-prompt?${params.toString()}`)
  }

  const handlePrevPage = () => {
    if (!pagination || !pagination.hasPrevPage) return
    setPage((p) => Math.max(1, p - 1))
  }

  const handleNextPage = () => {
    if (!pagination || !pagination.hasNextPage) return
    setPage((p) => p + 1)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Prompt History</h1>
        <p className="text-sm text-muted-foreground">
          Browse and revisit your previous prompts
        </p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
            Loading history...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-destructive">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
            No prompt history yet. Refine a prompt to see it here.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-accent/30"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </h3>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {item.toolMode}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.preview}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {formatDate(item.createdAt)}
                    </span>
                    <span>{item.versions} versions</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpen(item)}
                  >
                    <ArrowRight className="size-3.5" />
                    <span className="sr-only">Open prompt</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination && items.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <div>
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!pagination.hasPrevPage || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
