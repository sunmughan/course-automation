"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/components/providers/auth-provider";
import { SparklesIcon, Loader2Icon, MailIcon, LockIcon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);

    const user = await login(email, password);
    setLoading(false);

    if (user) {
      if (user.role === "admin") {
        window.location.href = "/dashboard/admin";
      } else if (user.role === "instructor") {
        window.location.href = "/dashboard/instructor";
      } else {
        window.location.href = "/dashboard";
      }
    }
  }

  const displayError = error || authError;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-xl">
            <SparklesIcon className="size-6 text-blue-500" />
            <span>CodeCraft</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue learning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} action="javascript:void(0)" method="POST" className="space-y-4">
              {displayError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {displayError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <MailIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}