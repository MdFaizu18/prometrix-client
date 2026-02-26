import { AuthLayout } from "@/components/prometrix/auth-layout"
import { ResetPasswordForm } from "@/components/prometrix/reset-password-form"

export const metadata = {
    title: "Reset Password - Prometrix",
    description: "Set a new password for your Prometrix account.",
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout>
            <ResetPasswordForm />
        </AuthLayout>
    )
}
