"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { createDemoAccount, signInDemoAccount } from "@/lib/demo-auth";

type AccountMode = "sign-in" | "create";

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AccountMode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      if (!isSupabaseConfigured) {
        const result = mode === "create"
          ? await createDemoAccount(fullName, email, password)
          : await signInDemoAccount(email, password);
        if ("error" in result) throw new Error(result.error);
        router.replace("/");
        router.refresh();
        return;
      }

      if (mode === "create") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (authError) throw authError;

        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          setMode("sign-in");
          setPassword("");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        router.replace("/");
        router.refresh();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "We couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back to shopping
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-zinc-500">Smart Stock</p>
            <h1 className="text-xl font-semibold text-zinc-900">
              {mode === "create" ? "Create your account" : "Welcome back"}
            </h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-zinc-600">
          {mode === "create"
            ? "Create an account to sign in as a Smart Stock customer."
            : "Sign in to your customer account."}
        </p>

        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Presentation mode: accounts are saved in this browser only. Add Supabase settings to enable live accounts.
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === "create" && (
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                autoComplete="name"
                required
                maxLength={100}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}

          <Button type="submit" disabled={busy} className="mt-1 w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          {mode === "create" ? "Already have an account?" : "New to Smart Stock?"}{" "}
          <button
            type="button"
            className="font-medium text-zinc-900 underline underline-offset-4"
            onClick={() => {
              setMode(mode === "create" ? "sign-in" : "create");
              setError("");
              setMessage("");
            }}
          >
            {mode === "create" ? "Sign in" : "Create account"}
          </button>
        </p>
      </section>
    </main>
  );
}
