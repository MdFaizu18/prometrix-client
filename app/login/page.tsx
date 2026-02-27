import { Suspense } from "react"
import LoginPageClient from "./login-page-client"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <LoginPageClient />
    </Suspense>
  )
}