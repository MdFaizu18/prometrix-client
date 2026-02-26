"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Zap, Target, TrendingUp, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api"

interface PromptAnalytics {
  _id: string
  userId: string
  promptId: string
  refinementCount: number
  successCount: number
  partialCount: number
  failureCount: number
  successRate: number
  failureRate: number
  totalTokensUsed: number
  lastRefinedAt?: string
  createdAt?: string
  updatedAt?: string
}

function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
  if (!match) return null
  return decodeURIComponent(match.split("=")[1] ?? "")
}

function formatDate(dateString?: string | null) {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString()
}

export default function PromptAnalyticsPage() {
  const params = useParams<{ promptId: string }>()
  const router = useRouter()
  const promptId = params?.promptId

  const [data, setData] = useState<PromptAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = useMemo(() => getAuthTokenFromCookie(), [])

  useEffect(() => {
    if (!token || !promptId) {
      if (!token) {
        setError("You must be logged in to view analytics.")
      }
      return
    }

    const loadPromptAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/${promptId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          const message = body?.message || "Failed to load prompt analytics."
          setError(message)
          setData(null)
          return
        }
        setData(body?.data ?? null)
      } catch {
        setError("Unable to load prompt analytics. Please try again.")
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadPromptAnalytics()
  }, [token, promptId])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => router.push("/analytics")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Prompt Analytics</h1>
            <p className="text-xs text-muted-foreground">
              Detailed performance metrics for this prompt.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {loading && !data && !error && (
            <p className="text-xs text-muted-foreground">Loading prompt analytics...</p>
          )}

          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}

          {data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Refinements</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {data.refinementCount}
                        </p>
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Zap className="size-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Success rate</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {data.successRate}%
                        </p>
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <TrendingUp className="size-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Success / Failure</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {data.successCount}/{data.failureCount}
                        </p>
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Target className="size-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Tokens used</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {data.totalTokensUsed.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="size-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Prompt ID:</span> {data.promptId}
                  </p>
                  {data.createdAt && (
                    <p>
                      <span className="font-medium text-foreground">First refined:</span>{" "}
                      {formatDate(data.createdAt)}
                    </p>
                  )}
                  {data.lastRefinedAt && (
                    <p>
                      <span className="font-medium text-foreground">Last refined:</span>{" "}
                      {formatDate(data.lastRefinedAt)}
                    </p>
                  )}
                  {data.updatedAt && (
                    <p>
                      <span className="font-medium text-foreground">Last updated record:</span>{" "}
                      {formatDate(data.updatedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

