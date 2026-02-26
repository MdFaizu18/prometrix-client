import { AuthLayout } from "@/components/prometrix/auth-layout"
import { ForgotPasswordForm } from "@/components/prometrix/forgot-password-form"

export const metadata = {
    title: "Forgot Password - Prometrix",
    description: "Reset your Prometrix account password.",
}

export default function ForgotPasswordPage() {
    return (
        <AuthLayout>
            <ForgotPasswordForm />
        </AuthLayout>
    )
}
