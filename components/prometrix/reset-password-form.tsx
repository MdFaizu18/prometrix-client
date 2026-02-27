"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    Check,
    X,
    ShieldCheck,
    CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"

const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://prometrix-server.vercel.app/api"

export function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)
    const [errors, setErrors] = useState<{
        password?: string
        confirmPassword?: string
    }>({})

    const passwordStrength = useMemo(() => {
        return PASSWORD_RULES.filter((r) => r.test(password)).length
    }, [password])

    const strengthLabel = useMemo(() => {
        if (password.length === 0) return null
        if (passwordStrength <= 1) return { text: "Weak", color: "bg-destructive" }
        if (passwordStrength <= 2) return { text: "Fair", color: "bg-warning" }
        if (passwordStrength <= 3) return { text: "Good", color: "bg-primary" }
        return { text: "Strong", color: "bg-success" }
    }, [password, passwordStrength])

    const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword

    if (!token) {
        return <p>Invalid reset link</p>
    }

    function validate() {
        const newErrors: { password?: string; confirmPassword?: string } = {}
        if (!password) {
            newErrors.password = "Password is required"
        } else if (passwordStrength < 3) {
            newErrors.password = "Password is not strong enough"
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password"
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return

        if (!token) {
            toast.error("Invalid or missing reset token")
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch(
                `${API_BASE_URL}/auth/reset-password?token=${token}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        password,
                        confirmPassword,
                    }),
                }
            )

            const data = await res.json()

            if (!res.ok) throw new Error(data.message)

            // ✅ Save login token returned after reset
            localStorage.setItem("token", data.data.token)

            setIsSuccess(true)
            toast.success(data.message)

        } catch (err: any) {
            toast.error(err.message || "Reset failed")
        } finally {
            setIsLoading(false)
        }
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="space-y-8">
                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-success/10">
                        <CheckCircle2 className="size-8 text-success" />
                    </div>
                </div>

                {/* Header */}
                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Password updated
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                </div>

                {/* CTA */}
                <Button
                    onClick={() => router.push("/login")}
                    className="h-10 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <span>Continue to sign in</span>
                    <ArrowRight className="size-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary">
                    <ShieldCheck className="size-7 text-primary" />
                </div>
            </div>

            {/* Header */}
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Set a new password
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Create a new password for your account. Make sure it is strong and unique.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                    <Label htmlFor="reset-password" className="text-foreground">
                        New password
                    </Label>
                    <div className="relative">
                        <Input
                            id="reset-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                            }}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            className={cn(
                                "h-10 pr-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20",
                                errors.password && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                            )}
                            autoComplete="new-password"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                        <div className="space-y-3 pt-1">
                            {/* Strength bar */}
                            <div className="flex items-center gap-3">
                                <div className="flex flex-1 gap-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1 flex-1 rounded-full transition-colors duration-300",
                                                i <= passwordStrength
                                                    ? strengthLabel?.color
                                                    : "bg-border"
                                            )}
                                        />
                                    ))}
                                </div>
                                {strengthLabel && (
                                    <span
                                        className={cn(
                                            "text-xs font-medium",
                                            passwordStrength <= 1
                                                ? "text-destructive"
                                                : passwordStrength <= 2
                                                    ? "text-warning"
                                                    : passwordStrength <= 3
                                                        ? "text-primary"
                                                        : "text-success"
                                        )}
                                    >
                                        {strengthLabel.text}
                                    </span>
                                )}
                            </div>

                            {/* Rules checklist */}
                            {(passwordFocused || errors.password) && (
                                <div className="space-y-1.5">
                                    {PASSWORD_RULES.map((rule) => {
                                        const passed = rule.test(password)
                                        return (
                                            <div
                                                key={rule.label}
                                                className="flex items-center gap-2"
                                            >
                                                {passed ? (
                                                    <Check className="size-3 text-success" />
                                                ) : (
                                                    <X className="size-3 text-muted-foreground" />
                                                )}
                                                <span
                                                    className={cn(
                                                        "text-xs transition-colors",
                                                        passed ? "text-success" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {rule.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {errors.password && !password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="reset-confirm-password" className="text-foreground">
                        Confirm password
                    </Label>
                    <div className="relative">
                        <Input
                            id="reset-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }))
                            }}
                            className={cn(
                                "h-10 pr-20 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20",
                                errors.confirmPassword && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                                passwordsMatch && "border-success/50 focus-visible:border-success focus-visible:ring-success/20"
                            )}
                            autoComplete="new-password"
                        />
                        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                            {/* Match indicator */}
                            {confirmPassword.length > 0 && (
                                <span className="flex items-center">
                                    {passwordsMatch ? (
                                        <Check className="size-4 text-success" />
                                    ) : (
                                        <X className="size-4 text-destructive" />
                                    )}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                tabIndex={-1}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                    {passwordsMatch && (
                        <p className="text-xs text-success">Passwords match</p>
                    )}
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>Resetting password...</span>
                        </>
                    ) : (
                        <>
                            <span>Reset password</span>
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>

            {/* Back to login */}
            <p className="text-center text-sm text-muted-foreground">
                <Link
                    href="/login"
                    className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                    Back to sign in
                </Link>
            </p>
        </div>
    )
}
