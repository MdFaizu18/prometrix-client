"use client"

import { Sparkles } from "lucide-react"
import Logo from "@/public/logo4.png"

interface AuthLayoutProps {
    children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
            {/* Left Branding Panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-sidebar p-10 lg:flex lg:w-[480px] xl:w-[540px]">
                {/* Subtle grid pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "linear-gradient(oklch(0.65 0.18 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.18 260) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Subtle radial glow */}
                <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/3 blur-3xl" />

                {/* Top: Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl ">
                            {/* <Sparkles className="size-5 text-primary-foreground" /> */}
                            <img src={Logo.src} alt="Prometrix" width={40} height={40} />
                        </div>
                        <span className="text-xl font-semibold tracking-tight text-foreground">
                            Prometrix
                        </span>
                    </div>
                </div>

                {/* Middle: Tagline */}
                <div className="relative z-10 space-y-6">
                    <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground xl:text-4xl">
                        Your AI-powered prompt engineering command center.
                    </h1>
                    <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
                        Write, refine, and ship production-grade prompts with confidence. Trusted by developers.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-3 pt-2">
                        {[
                            "Intelligent prompt refinement engine",
                            "Version history with quality scoring",
                            "Template library with multiple patterns",
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                                    <div className="size-1.5 rounded-full bg-primary" />
                                </div>
                                <span className="text-sm text-muted-foreground">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Testimonial */}
                <div className="relative z-10 space-y-4">
                    <div className="h-px bg-border" />
                    <blockquote className="text-sm italic leading-relaxed text-muted-foreground">
                        {'"Prometrix cut our prompt iteration time by 70%. It\'s an indispensable part of our AI workflow now."'}
                    </blockquote>
                    {/* <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                            MF
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Md Faizu</p>
                            <p className="text-xs text-muted-foreground">
                                Head of AI, Acme Corp
                            </p>
                        </div>
                    </div> */}
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex flex-1 flex-col">
                {/* Mobile Logo */}
                <div className="flex items-center gap-2.5 p-6 lg:hidden">
                    <div className="flex size-8 items-center justify-center rounded-lg ">
                        {/* <Sparkles className="size-4 text-primary-foreground" /> */}
                        <img src={Logo.src} alt="Prometrix" width={32} height={32} />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-foreground">
                        Prometrix
                    </span>
                </div>

                {/* Form Container */}
                <div className="flex flex-1 items-center justify-center px-6 py-12">
                    <div className="w-full max-w-[400px]">{children}</div>
                </div>

                {/* Footer */}
                <div className="px-6 py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        By continuing, you agree to our{" "}
                        <a href="#" className="text-foreground underline underline-offset-4 transition-colors hover:text-primary">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-foreground underline underline-offset-4 transition-colors hover:text-primary">
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
