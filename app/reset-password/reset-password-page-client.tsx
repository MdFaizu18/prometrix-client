"use client"

import { AuthLayout } from "@/components/prometrix/auth-layout"
import { ResetPasswordForm } from "@/components/prometrix/reset-password-form"

export default function ResetPasswordPageClient() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}

