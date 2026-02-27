"use client"

import { useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/prometrix/auth-layout"
import { LoginForm } from "@/components/prometrix/login-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPageClient() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")

  const showNotAuth = reason === "not-authenticated"

  return (
    <AuthLayout>
      <div className="space-y-4">
        {showNotAuth && (
          <Alert variant="default">
            <AlertTitle>Not authenticated</AlertTitle>
            <AlertDescription>
              Your session has expired or you&apos;re not signed in. Please log in to continue.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm />
      </div>
    </AuthLayout>
  )
}

