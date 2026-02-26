import { AuthLayout } from "@/components/prometrix/auth-layout"
import { RegisterForm } from "@/components/prometrix/register-form"

export const metadata = {
    title: "Create Account - Prometrix",
    description: "Create your Prometrix account and start engineering AI prompts with confidence.",
}

export default function RegisterPage() {
    return (
        <AuthLayout>
            <RegisterForm />
        </AuthLayout>
    )
}
