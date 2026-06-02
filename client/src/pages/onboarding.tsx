import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";

interface QA { q: string; a: string }

const QUESTIONS: { q: string; intro: string; placeholder: string }[] = [
  {
    q: "What's something you love doing that you've never been graded on?",
    intro: "Hey! I'm UniVibe's onboarding friend. We're just gonna chat — no right answers.",
    placeholder: "Making weird playlists for my friends. I take it way too seriously.",
  },
  {
    q: "When you picture your ideal Friday at uni, what does it look like?",
    intro: "Okay, love that. Next one's a vibe check.",
    placeholder: "A small dinner with a few people, then maybe a late movie.",
  },
  {
    q: "If you had to pick one word for how you want to feel in your first week, what would it be?",
    intro: "Just one word is enough. Trust your gut.",
    placeholder: "Calm. Or maybe brave?",
  },
  {
    q: "What's something you're a little nervous about as uni starts?",
    intro: "It's chill to be honest here — everyone's got something.",
    placeholder: "Honestly making friends. I'm not great at the small talk thing.",
  },
  {
    q: "If you could join a room of people who get *one* thing about you, what would that thing be?",
    intro: "Not a hobby exactly — more like a tiny secret part of you.",
    placeholder: "That I overthink films for days after watching them.",
  },
  {
    q: "What's something you'd want to learn or build this year, just for you?",
    intro: "Not for a CV. For you.",
    placeholder: "Make a zine. Or learn to actually code, properly.",
  },
  {
    q: "Last one — who do you hope you'll be by the end of first year?",
    intro: "Take a second with this one.",
    placeholder: "Someone with a small but real group of friends, and a project I'm proud of.",
  },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QA[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  if (!user) return null;

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];

  async function next() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const updated = [...answers, { q: current.q, a: trimmed }];
    setAnswers(updated);
    setDraft("");
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      // Complete
      setSubmitting(true);
      try {
        const res = await apiRequest("POST", "/api/onboarding/complete", {
          userId: user!.id,
          answers: updated,
        });
        await res.json();
        navigate("/dashboard");
      } catch (err: any) {
        toast({
          title: "Hmm, something hiccupped",
          description: err?.message ?? "Try again in a moment.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      next();
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Logo />
          <div className="text-xs text-muted-foreground" data-testid="text-progress">
            Step {step + 1} of {total}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-6 py-10 sm:py-14">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-8" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all duration-300 " +
                (i < step
                  ? "w-6 bg-primary"
                  : i === step
                  ? "w-10 bg-primary"
                  : "w-3 bg-secondary")
              }
            />
          ))}
        </div>

        {/* AI message bubble */}
        {!submitting ? (
          <div key={step} className="float-in">
            <div className="flex items-start gap-3">
              <span className="size-9 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center font-display font-semibold">
                <Sparkles className="size-4" />
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground" data-testid="text-ai-intro">
                  {current.intro}
                </p>
                <Card className="px-4 py-4 rounded-2xl rounded-tl-md border-card-border bg-card shadow-xs">
                  <p className="font-display text-lg sm:text-xl leading-snug" data-testid={`text-question-${step}`}>
                    {current.q}
                  </p>
                </Card>
              </div>
            </div>

            {/* Answer input */}
            <div className="mt-6 pl-12">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder={current.placeholder}
                rows={3}
                className="bg-background resize-none rounded-2xl text-base"
                data-testid={`input-answer-${step}`}
                maxLength={500}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</span>
                <Button
                  onClick={next}
                  disabled={!draft.trim()}
                  className="gap-2 rounded-xl"
                  data-testid={`button-next-${step}`}
                >
                  {step === total - 1 ? "Finish & meet your rooms" : "Next"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Already answered history (compact recap) */}
            {answers.length > 0 && (
              <ul className="mt-10 space-y-3">
                {answers.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 opacity-70">
                    <span className="size-7 shrink-0 rounded-full bg-secondary grid place-items-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{a.q}</p>
                      <p className="text-sm">{a.a}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-2 text-primary">
              <Loader2 className="size-5 animate-spin" />
              <span className="font-display text-lg">Reading between the lines…</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Shaping your profile and finding your rooms.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
