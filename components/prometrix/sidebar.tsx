"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  LayoutTemplate,
  Clock,
  BarChart3,
  ChevronRight,
  Search,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Logo from "@/public/logo4.png"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

type NavItem = "new-prompt" | "templates" | "history" | "analytics"

interface SidebarProps {
  onNavigate?: () => void
}

interface AuthUser {
  id: string
  name: string
  email: string
  role?: string
}

const navItems: { id: NavItem; label: string; icon: React.ElementType; href: string }[] = [
  { id: "new-prompt", label: "New Prompt", icon: Plus, href: "/new-prompt" },
  { id: "templates", label: "Templates", icon: LayoutTemplate, href: "/templates" },
  { id: "history", label: "History", icon: Clock, href: "/history" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api"

function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
  if (!match) return null
  return decodeURIComponent(match.split("=")[1] ?? "")
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const token = getAuthTokenFromCookie()
    if (!token) return

    const controller = new AbortController()

    async function fetchMe() {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) {
          return
        }

        const apiUser = data?.data?.user ?? data?.data
        if (!apiUser) return

        setUser({
          id: apiUser.id || apiUser._id,
          name: apiUser.name || apiUser.email || "User",
          email: apiUser.email,
          role: apiUser.role,
        })
      } catch {
        // ignore for now; sidebar will just show fallback user
      }
    }

    fetchMe()

    return () => controller.abort()
  }, [])

  const handleLogout = async () => {
    const token = getAuthTokenFromCookie()

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null)
      }
    } finally {
      // Clear auth cookie locally
      if (typeof document !== "undefined") {
        document.cookie = "auth_token=; path=/; max-age=0; sameSite=Lax"
      }
      setUser(null)
      toast.success("Logged out successfully")
      router.push("/login")
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg ">
          {/* <Sparkles className="size-4 text-primary-foreground" /> */}
          <img src={Logo.src} alt="Prometrix" width={28} height={28} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          Prometrix
        </span>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <button className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
          <Search className="size-3.5" />
          <span>Search prompts...</span>
          <kbd className="ml-auto rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {"/"} 
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-4">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("size-4", isActive && "text-primary")} />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}

        {user?.role === "admin" && (
          <div className="mt-4 space-y-1.5">
            <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/users"
                  onClick={() => onNavigate?.()}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    pathname.startsWith("/admin")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      "size-4",
                      pathname.startsWith("/admin") && "text-primary"
                    )}
                  />
                  <span>Users & Analytics</span>
                  {pathname.startsWith("/admin") && (
                    <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Admin users & insights</TooltipContent>
            </Tooltip>
          </div>
        )}
      </nav>

      {/* Bottom Profile */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {((user?.name || "Guest")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()) || "GU"}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-foreground">
              {user?.name || "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
            </p>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <LogOut className="size-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
