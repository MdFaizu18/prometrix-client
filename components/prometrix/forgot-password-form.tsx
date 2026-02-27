"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://prometrix-server.vercel.app/api"

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [error, setError] = useState("")
    
    function validate() {
        if (!email.trim()) {
            setError("Email is required")
            return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Enter a valid email address")
            return false
        }
        setError("")
        return true
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return

        setIsLoading(true)

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong")
            }

            setIsSent(true)
            toast.success(data.message)

        } catch (err: any) {
            toast.error(err.message || "Failed to send reset link")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleResend() {
        setIsLoading(true)

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message)
            }

            toast.success("Reset link resent")

        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    // Success state after email is sent
    if (isSent) {
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
                        Check your email
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {"We've sent a password reset link to"}
                    </p>
                    <p className="text-sm font-medium text-foreground">{email}</p>
                </div>

                {/* Email icon illustration */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="flex size-20 items-center justify-center rounded-2xl border border-border bg-secondary">
                            <Mail className="size-9 text-muted-foreground" />
                        </div>
                        {/* Animated dot */}
                        <div className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-background bg-primary">
                            <div className="size-full animate-ping rounded-full bg-primary opacity-40" />
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3 rounded-lg border border-border bg-secondary/50 p-4">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Click the link in the email to reset your password. The link will expire in 15 minutes.
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        {"If you don't see the email, check your spam or junk folder."}
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        onClick={handleResend}
                        disabled={isLoading}
                        variant="outline"
                        className="h-10 w-full gap-2 border-border bg-secondary text-foreground hover:bg-accent"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Resending...</span>
                            </>
                        ) : (
                            <>
                                <Mail className="size-4" />
                                <span>Resend email</span>
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={() => {
                            setIsSent(false)
                            setEmail("")
                        }}
                        variant="ghost"
                        className="h-10 w-full gap-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        Try a different email
                    </Button>
                </div>

                {/* Back to login */}
                <p className="text-center text-sm text-muted-foreground">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to sign in
                    </Link>
                </p>
            </div>
        )
    }

    // Default form state
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Forgot your password?
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    {"No worries. Enter the email address associated with your account and we'll send you a link to reset your password."}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-foreground">
                        Email address
                    </Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="forgot-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (error) setError("")
                            }}
                            className={cn(
                                "h-10 pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20",
                                error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                            )}
                            autoComplete="email"
                            autoFocus
                        />
                    </div>
                    {error && (
                        <p className="text-xs text-destructive">{error}</p>
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
                            <span>Sending reset link...</span>
                        </>
                    ) : (
                        <>
                            <span>Send reset link</span>
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>

            {/* Back to login */}
            <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                    <ArrowLeft className="size-3.5" />
                    Back to sign in
                </Link>
            </p>
        </div>
    )
}
