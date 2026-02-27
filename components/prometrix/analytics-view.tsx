"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { TrendingUp, Zap, Target, FileText, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://prometrix-server.vercel.app/api"

interface AnalyticsSummary {
  totalRefinements: number
  totalSuccess: number
  totalFailures: number
  totalTokens: number
  overallSuccessRate: string
}

interface AnalyticsPerPrompt {
  _id: string
  promptId: {
    _id: string
    title: string
    toolMode?: string
    tone?: string
  }
  refinementCount: number
  successCount: number
  partialCount: number
  failureCount: number
  successRate: number
  failureRate: number
  totalTokensUsed: number
  lastRefinedAt?: string
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
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

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsView() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [perPrompt, setPerPrompt] = useState<AnalyticsPerPrompt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = useMemo(() => getAuthTokenFromCookie(), [])

  useEffect(() => {
    if (!token) {
      setError("You must be logged in to view analytics.")
      setSummary(null)
      setPerPrompt([])
      return
    }

    const loadAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/analytics`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          const message = data?.message || "Failed to load analytics."
          setError(message)
          setSummary(null)
          setPerPrompt([])
          return
        }
        setSummary(data?.data?.summary ?? null)
        setPerPrompt(data?.data?.perPrompt ?? [])
      } catch {
        setError("Unable to load analytics. Please try again.")
        setSummary(null)
        setPerPrompt([])
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [token])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track how your prompts perform over time.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {loading && !summary && !error && (
            <p className="text-xs text-muted-foreground">Loading analytics...</p>
          )}

          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}

          {summary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total refinements"
                value={String(summary.totalRefinements)}
                icon={Zap}
              />
              <StatCard
                title="Successful refinements"
                value={String(summary.totalSuccess)}
                icon={Target}
              />
              <StatCard
                title="Success rate"
                value={`${summary.overallSuccessRate}%`}
                icon={TrendingUp}
              />
              <StatCard
                title="Tokens used"
                value={summary.totalTokens.toLocaleString()}
                icon={FileText}
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              Per-prompt breakdown
            </p>
            {!loading && perPrompt.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No analytics data available yet. Refine some prompts to see stats here.
              </p>
            ) : (
              <div className="space-y-2">
                {perPrompt.map((p) => (
                  <Link
                    key={p._id}
                    href={`/analytics/${p.promptId._id}`}
                    className="block rounded-lg border border-border bg-card/60 p-3 text-xs transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.promptId?.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.promptId?.toolMode}
                          {p.promptId?.tone ? ` • ${p.promptId.tone}` : null}
                        </p>
                      </div>
                      <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                        {p.successRate}% success
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{p.refinementCount} refinements</span>
                      <span className="text-border">•</span>
                      <span>{p.totalTokensUsed.toLocaleString()} tokens</span>
                      {p.lastRefinedAt && (
                        <>
                          <span className="text-border">•</span>
                          <span>Last {formatDate(p.lastRefinedAt)}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
