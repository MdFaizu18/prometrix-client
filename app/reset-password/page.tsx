import { Suspense } from "react"
import ResetPasswordPageClient from "./reset-password-page-client"

export const metadata = {
    title: "Reset Password - Prometrix",
    description: "Set a new password for your Prometrix account.",
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <ResetPasswordPageClient />
    </Suspense>
  )
}
