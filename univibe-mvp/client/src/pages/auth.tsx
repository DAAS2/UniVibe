import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

type Mode = "login" | "signup" | "demo";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ mode?: string }>("/auth/:mode");
  const { setUser } = useAuth();
  const { toast } = useToast();

  const initialMode: Mode =
    params?.mode === "signup" ? "signup" : params?.mode === "demo" ? "demo" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params?.mode === "signup") setMode("signup");
    else if (params?.mode === "demo") setMode("demo");
    else if (params?.mode === "login" || !params?.mode) setMode((m) => m);
  }, [params?.mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "demo") {
        const res = await apiRequest("POST", "/api/auth/demo", {
          displayName: displayName || "Demo Student",
        });
        const data = await res.json();
        setUser(data.user);
        navigate("/onboarding");
        return;
      }
      if (mode === "signup") {
        const res = await apiRequest("POST", "/api/auth/signup", {
          username,
          password,
          displayName: displayName || username,
        });
        const data = await res.json();
        setUser(data.user);
        navigate("/onboarding");
        return;
      }
      // login
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await res.json();
      setUser(data.user);
      // If they have a profile already, jump to dashboard; else onboarding.
      try {
        const p = await apiRequest("GET", `/api/profile/${data.user.id}`);
        if (p.ok) navigate("/dashboard");
        else navigate("/onboarding");
      } catch {
        navigate("/onboarding");
      }
    } catch (err: any) {
      toast({
        title: "Couldn't continue",
        description: err?.message ?? "Something went sideways. Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/">
            <a className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-home">
              <ArrowLeft className="size-3.5" /> Back
            </a>
          </Link>
          <Logo />
          <div className="w-12" />
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-5 py-12">
        <Card className="w-full max-w-md p-7 sm:p-8 rounded-3xl border-card-border shadow-lg bg-card">
          <p className="font-hand text-primary text-sm mb-2">
            {mode === "demo" ? "skip the friction" : mode === "signup" ? "welcome in" : "welcome back"}
          </p>
          <h1 className="text-3xl font-semibold leading-tight">
            {mode === "demo" ? "Continue as demo student" : mode === "signup" ? "Start your journey" : "Log back in"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "demo"
              ? "No account, no email — just pick a name and dive in. We won't keep anything past this session."
              : mode === "signup"
              ? "A username and password is all we need. Real auth (Supabase) drops in later."
              : "Pick up where you left off."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode !== "login" && (
              <div>
                <Label htmlFor="displayName">Your name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                  className="mt-1.5 bg-background"
                  required={mode === "signup"}
                  data-testid="input-display-name"
                  autoFocus
                />
              </div>
            )}
            {mode !== "demo" && (
              <>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="e.g. mira_starts_uni"
                    className="mt-1.5 bg-background"
                    minLength={2}
                    required
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Keep it simple for demo"
                    className="mt-1.5 bg-background"
                    minLength={4}
                    required
                    data-testid="input-password"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full rounded-xl text-base"
              data-testid="button-auth-submit"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              {mode === "demo" ? "Continue" : mode === "signup" ? "Create account & start" : "Log in"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-card-border text-sm space-y-2 text-center">
            {mode !== "demo" && (
              <p>
                {mode === "signup" ? "Already here?" : "First time?"}{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                  data-testid="button-toggle-mode"
                >
                  {mode === "signup" ? "Log in" : "Make an account"}
                </button>
              </p>
            )}
            {mode !== "demo" ? (
              <p className="text-muted-foreground">
                Or{" "}
                <button
                  type="button"
                  className="text-foreground font-medium hover:underline"
                  onClick={() => setMode("demo")}
                  data-testid="button-switch-demo"
                >
                  continue as demo student
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Want an account?{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode("signup")}
                  data-testid="button-switch-signup"
                >
                  Sign up instead
                </button>
              </p>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
