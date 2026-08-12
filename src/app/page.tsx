import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Code2Icon,
  BotIcon,
  EyeIcon,
  FolderKanbanIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";

const features = [
  {
    icon: Code2Icon,
    title: "Interactive IDE",
    description:
      "Write, run, and debug code in a fully-featured browser-based IDE with real-time execution and visualization.",
  },
  {
    icon: BotIcon,
    title: "AI Tutor",
    description:
      "Get personalized guidance from an AI tutor that explains concepts, reviews your code, and answers questions in real-time.",
  },
  {
    icon: EyeIcon,
    title: "Visual Execution",
    description:
      "Watch your code execute step-by-step with animated visualizations showing data flow, memory state, and algorithm behavior.",
  },
  {
    icon: FolderKanbanIcon,
    title: "Real Projects",
    description:
      "Build portfolio-worthy projects with guided instructions, code reviews, and AI-powered feedback on your implementations.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <SparklesIcon className="size-5 text-blue-500" />
            <span>CodeCraft</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" render={<Link href="/login" />}>
              Sign In
            </Button>
            <Button render={<Link href="/register" />}>Get Started</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
                <SparklesIcon className="size-4 text-blue-500" />
                AI-Powered Learning Platform
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Learn, Code,{" "}
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Visualize, Master
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                An AI-powered platform that transforms how you learn software engineering.
                Interactive coding, real-time execution visualization, and personalized AI
                tutoring — all in one place.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="h-11 px-8 text-base"
                  render={<Link href="/login" />}
                >
                  Start Learning
                  <ArrowRightIcon className="ml-1 size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 px-8 text-base"
                  render={<Link href="/dashboard/courses" />}
                >
                  Explore Courses
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to master software engineering
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our platform combines powerful tools with AI-driven guidance to create
                the most effective learning experience.
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="group transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                      <feature.icon className="size-5 text-blue-500" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to start your journey?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of developers learning software engineering with AI-powered
                guidance.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="h-11 px-8 text-base"
                  render={<Link href="/register" />}
                >
                  Create Free Account
                  <ArrowRightIcon className="ml-1 size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 px-8 text-base"
                  render={<Link href="/dashboard/courses" />}
                >
                  Browse Courses
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SparklesIcon className="size-4 text-blue-500" />
              <span>CodeCraft — AI-Powered Software Engineering Training</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CodeCraft. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}