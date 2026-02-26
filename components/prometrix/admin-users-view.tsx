"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api"
const PAGE_SIZE = 10

interface AdminUser {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  promptCount?: number
  createdAt?: string
  updatedAt?: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface AdminPromptHistoryItem {
  _id: string
  title: string
  description?: string | null
  rawPrompt?: string | null
  toolMode?: string
  tone?: string
  techStack?: string[]
  isDeleted?: boolean
  versionCount?: number
  currentVersion?: {
    versionNumber: number
    refinedPrompt?: string
    createdAt?: string
    feedbackStatus?: string
  }
  createdAt?: string
  updatedAt?: string
}

interface AdminAnalyticsSummary {
  totalRefinements: number
  totalSuccess: number
  totalFailures: number
  totalTokens: number
  overallSuccessRate: string
}

interface AdminAnalyticsPerPrompt {
  _id: string
  promptId: {
    _id: string
    title: string
    toolMode: string
    tone: string
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

interface AdminPromptVersion {
  _id: string
  promptId: string
  versionNumber: number
  rawPrompt: string
  refinedPrompt: string
  refinementSettings?: {
    toolMode: string
    techStack: string[]
    tone: string
    model: string
  }
  createdAt?: string
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

export function AdminUsersView() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedTab, setSelectedTab] = useState<"history" | "analytics">("history")

  const [historyItems, setHistoryItems] = useState<AdminPromptHistoryItem[]>([])
  const [historyPagination, setHistoryPagination] = useState<Pagination | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [analyticsSummary, setAnalyticsSummary] = useState<AdminAnalyticsSummary | null>(null)
  const [analyticsPerPrompt, setAnalyticsPerPrompt] = useState<AdminAnalyticsPerPrompt[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const [versionsPromptId, setVersionsPromptId] = useState<string | null>(null)
  const [versions, setVersions] = useState<AdminPromptVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  const token = useMemo(() => getAuthTokenFromCookie(), [])

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(handle)
  }, [search])

  const loadUsers = useCallback(
    async (pageNumber: number) => {
      if (!token) {
        setUsersError("You must be logged in as an admin to view this page.")
        setUsers([])
        setPagination(null)
        return
      }

      setLoadingUsers(true)
      setUsersError(null)

      try {
        const url = new URL(`${API_BASE_URL}/admin/users`)
        url.searchParams.set("page", String(pageNumber))
        url.searchParams.set("limit", String(PAGE_SIZE))
        if (debouncedSearch.trim()) url.searchParams.set("search", debouncedSearch.trim())
        if (roleFilter !== "all") url.searchParams.set("role", roleFilter)
        if (statusFilter !== "all") url.searchParams.set("isActive", statusFilter === "active" ? "true" : "false")

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) {
          const message = data?.message || "Failed to load users."
          setUsersError(message)
          setUsers([])
          setPagination(null)
          return
        }

        const apiUsers: AdminUser[] = data?.data?.users ?? []
        const pageInfo: Pagination | null = data?.data?.pagination ?? null

        setUsers(apiUsers)
        if (pageInfo) setPagination(pageInfo)
      } catch {
        setUsersError("Unable to load users. Please try again.")
        setUsers([])
        setPagination(null)
      } finally {
        setLoadingUsers(false)
      }
    },
    [token, debouncedSearch, roleFilter, statusFilter]
  )

  useEffect(() => {
    loadUsers(page)
  }, [loadUsers, page])

  const handleToggleStatus = async (user: AdminUser) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${user._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        console.error(data?.message || "Failed to update user status")
        return
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !user.isActive } : u))
      )
    } catch {
      console.error("Failed to update user status")
    }
  }

  const loadUserHistory = useCallback(
    async (userId: string, pageNumber: number) => {
      if (!token) return
      setLoadingHistory(true)
      try {
        const url = new URL(`${API_BASE_URL}/admin/users/${userId}/prompts`)
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
          setHistoryItems([])
          setHistoryPagination(null)
          return
        }
        const apiHistory: AdminPromptHistoryItem[] = data?.data?.history ?? []
        const pageInfo: Pagination | null = data?.data?.pagination ?? null

        setHistoryItems(apiHistory)
        if (pageInfo) setHistoryPagination(pageInfo)
      } catch {
        setHistoryItems([])
        setHistoryPagination(null)
      } finally {
        setLoadingHistory(false)
      }
    },
    [token]
  )

  const loadUserAnalytics = useCallback(
    async (userId: string) => {
      if (!token) return
      setLoadingAnalytics(true)
      try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/analytics`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setAnalyticsSummary(null)
          setAnalyticsPerPrompt([])
          return
        }
        setAnalyticsSummary(data?.data?.summary ?? null)
        setAnalyticsPerPrompt(data?.data?.perPrompt ?? [])
      } catch {
        setAnalyticsSummary(null)
        setAnalyticsPerPrompt([])
      } finally {
        setLoadingAnalytics(false)
      }
    },
    [token]
  )

  const loadPromptVersions = useCallback(
    async (promptId: string) => {
      if (!token) return
      setLoadingVersions(true)
      setVersionsPromptId(promptId)
      try {
        const res = await fetch(`${API_BASE_URL}/admin/prompts/${promptId}/versions`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setVersions([])
          return
        }
        setVersions(data?.data?.versions ?? [])
      } catch {
        setVersions([])
      } finally {
        setLoadingVersions(false)
      }
    },
    [token]
  )

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user)
    setSelectedTab("history")
    setHistoryPage(1)
    loadUserHistory(user._id, 1)
    loadUserAnalytics(user._id)
  }

  const handleHistoryPrevPage = () => {
    if (!historyPagination || !historyPagination.hasPrevPage || !selectedUser) return
    const nextPage = Math.max(1, historyPage - 1)
    setHistoryPage(nextPage)
    loadUserHistory(selectedUser._id, nextPage)
  }

  const handleHistoryNextPage = () => {
    if (!historyPagination || !historyPagination.hasNextPage || !selectedUser) return
    const nextPage = historyPage + 1
    setHistoryPage(nextPage)
    loadUserHistory(selectedUser._id, nextPage)
  }

  const handleOpenPromptInEditor = (item: AdminPromptHistoryItem) => {
    const params = new URLSearchParams()
    if (item.title) params.set("title", item.title)
    const prompt = item.currentVersion?.refinedPrompt || item.rawPrompt || ""
    if (prompt) params.set("prompt", prompt)
    router.push(`/new-prompt?${params.toString()}`)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Users & Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Manage users, review their prompt history, and monitor performance.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Users className="size-3.5" />
            <span>{pagination?.total ?? 0} total users</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        {/* Users list */}
        <section className="flex w-full flex-col rounded-xl border border-border bg-card lg:w-2/5">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Users</p>
                  <p className="text-xs text-muted-foreground">
                    Search, filter and manage account status.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Search by name or email..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={roleFilter}
                    onValueChange={(v) => {
                      setRoleFilter(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingUsers && users.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 py-6 text-xs text-muted-foreground">
                Loading users...
              </div>
            ) : usersError ? (
              <div className="flex h-full items-center justify-center px-4 py-6 text-xs text-destructive">
                {usersError}
              </div>
            ) : users.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 py-6 text-xs text-muted-foreground">
                No users found for the current filters.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((u) => {
                  const isSelected = selectedUser?._id === u._id
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left text-xs transition-colors",
                        isSelected
                          ? "bg-accent/40"
                          : "hover:bg-accent/20"
                      )}
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-primary">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {u.name}
                          </p>
                          <Badge
                            variant={u.role === "admin" ? "default" : "outline"}
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {u.role}
                          </Badge>
                          <Badge
                            variant={u.isActive ? "outline" : "destructive"}
                            className={cn(
                              "px-1.5 py-0 text-[10px]",
                              !u.isActive && "border-destructive/40 bg-destructive/10"
                            )}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {u.email}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{u.promptCount ?? 0} prompts</span>
                          {u.createdAt && (
                            <>
                              <span className="text-border">•</span>
                              <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStatus(u)
                          }}
                        >
                          {u.isActive ? (
                            <UserX className="size-3.5" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                        </Button>
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {pagination && users.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
              <div>
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={!pagination.hasPrevPage || loadingUsers}
                  onClick={() => {
                    if (!pagination.hasPrevPage) return
                    setPage((p) => Math.max(1, p - 1))
                  }}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={!pagination.hasNextPage || loadingUsers}
                  onClick={() => {
                    if (!pagination.hasNextPage) return
                    setPage((p) => p + 1)
                  }}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Right panel: user details */}
        <section className="flex w-full flex-1 flex-col rounded-xl border border-border bg-card">
          {!selectedUser ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                <Users className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a user to inspect</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Choose a user from the list to view their prompt history and analytics.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-border px-5 pt-4">
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selectedUser.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={selectedUser.role === "admin" ? "default" : "outline"}
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {selectedUser.role}
                    </Badge>
                    <Badge
                      variant={selectedUser.isActive ? "outline" : "destructive"}
                      className={cn(
                        "px-1.5 py-0 text-[10px]",
                        !selectedUser.isActive && "border-destructive/40 bg-destructive/10"
                      )}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedTab("history")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium",
                      selectedTab === "history"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    )}
                  >
                    History
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTab("analytics")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium",
                      selectedTab === "analytics"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    )}
                  >
                    Analytics
                  </button>
                </div>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedTab === "history" ? (
                  <div className="space-y-3">
                    {loadingHistory && historyItems.length === 0 ? (
                      <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
                        Loading prompt history...
                      </div>
                    ) : historyItems.length === 0 ? (
                      <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
                        No prompts found for this user.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {historyItems.map((item) => (
                          <div
                            key={item._id}
                            className="group rounded-lg border border-border bg-background/40 p-3 text-xs transition-colors hover:border-primary/30 hover:bg-accent/30"
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                <Users className="size-3.5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {item.title}
                                  </p>
                                  {item.toolMode && (
                                    <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                                      {item.toolMode}
                                    </Badge>
                                  )}
                                  {item.tone && (
                                    <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                                      {item.tone}
                                    </Badge>
                                  )}
                                </div>
                                <p className="line-clamp-2 text-[11px] text-muted-foreground">
                                  {item.description || item.rawPrompt}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                  {item.currentVersion?.versionNumber && (
                                    <span>
                                      v{item.currentVersion.versionNumber} •{" "}
                                      {item.versionCount ?? 1} versions
                                    </span>
                                  )}
                                  {item.currentVersion?.createdAt && (
                                    <>
                                      <span className="text-border">•</span>
                                      <span>
                                        Last refined {formatDate(item.currentVersion.createdAt)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-foreground"
                                  type="button"
                                  onClick={() => handleOpenPromptInEditor(item)}
                                >
                                  <ArrowRight className="size-3.5" />
                                  <span className="sr-only">Open in editor</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-foreground"
                                  type="button"
                                  onClick={() => loadPromptVersions(item._id)}
                                >
                                  {loadingVersions && versionsPromptId === item._id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <span className="text-[9px] uppercase tracking-wide">
                                      v
                                    </span>
                                  )}
                                  <span className="sr-only">View versions</span>
                                </Button>
                              </div>
                            </div>

                            {versionsPromptId === item._id && versions.length > 0 && (
                              <div className="mt-3 space-y-1 rounded-md bg-secondary/40 p-2">
                                <p className="text-[10px] font-medium text-muted-foreground">
                                  Versions
                                </p>
                                <div className="space-y-1.5">
                                  {versions.map((v) => (
                                    <div
                                      key={v._id}
                                      className="rounded border border-border/60 bg-background/40 p-1.5 text-[10px]"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-[10px] text-primary">
                                          v{v.versionNumber}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatDate(v.createdAt)}
                                        </span>
                                      </div>
                                      <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                                        {v.refinedPrompt}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {historyPagination && historyItems.length > 0 && (
                      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                        <div>
                          Page {historyPagination.page} of {historyPagination.totalPages}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            disabled={!historyPagination.hasPrevPage || loadingHistory}
                            onClick={handleHistoryPrevPage}
                          >
                            <ChevronLeft className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            disabled={!historyPagination.hasNextPage || loadingHistory}
                            onClick={handleHistoryNextPage}
                          >
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loadingAnalytics && !analyticsSummary ? (
                      <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
                        Loading analytics...
                      </div>
                    ) : !analyticsSummary ? (
                      <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
                        No analytics data available for this user yet.
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-lg border border-border bg-background/60 p-3">
                            <p className="text-[11px] text-muted-foreground">Total refinements</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">
                              {analyticsSummary.totalRefinements}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-background/60 p-3">
                            <p className="text-[11px] text-muted-foreground">Success rate</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">
                              {analyticsSummary.overallSuccessRate}%
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-background/60 p-3">
                            <p className="text-[11px] text-muted-foreground">Tokens used</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">
                              {analyticsSummary.totalTokens.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-foreground">
                            Per-prompt breakdown
                          </p>
                          {analyticsPerPrompt.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              No per-prompt analytics available.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {analyticsPerPrompt.map((p) => (
                                <div
                                  key={p._id}
                                  className="rounded-lg border border-border bg-background/50 p-3 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {p.promptId?.title}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {p.promptId?.toolMode} • {p.promptId?.tone}
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
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

