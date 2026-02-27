"use client"

import { useEffect, useState } from "react"
import { Menu, Sparkles } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/prometrix/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"

function hasAuthToken(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie.split("; ").some((row) => row.startsWith("auth_token="))
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Auth guard for all workspace routes
  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace("/login?reason=not-authenticated")
      return
    }
    setCheckedAuth(true)
  }, [router])

  // Avoid flashing protected UI before auth check / redirect
  if (!checkedAuth) {
    return null
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Mobile Header */}
      <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen((v) => !v)}
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

        <div className="size-9" />
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Drawer */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-64 p-0"
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-64 lg:shrink-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}