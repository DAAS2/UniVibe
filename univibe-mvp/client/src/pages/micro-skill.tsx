import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Sparkles, RefreshCw,
} from "lucide-react";
import type { MicroSkillCompletion } from "@shared/schema";

// ----------------------------------------------------------------------------
// Micro-skill — a 5-step mini lesson generated on demand.
// Reached from career-pathway cards: /#/micro-skill?topic=<topic>&path=<kind>
// We read the search portion from window.location.hash (wouter hash routing
// puts query params after the path inside the hash itself).
// Progress is held in React state. Completion is POSTed to the backend so it
// shows up persistently without using localStorage.
// ----------------------------------------------------------------------------

interface MicroSkillStep {
  index: number;
  kind: "reflect" | "choice";
  prompt: string;
  options?: string[];
  hint?: string;
}
interface MicroSkillLesson {
  topic: string;
  intro: string;
  steps: MicroSkillStep[];
  outro: string;
  source: "gemini" | "fallback";
}

function parseHashQuery(): { topic: string; path?: string } {
  if (typeof window === "undefined") return { topic: "" };
  // Hash looks like: #/micro-skill?topic=...&path=...
  const hash = window.location.hash || "";
  const qIdx = hash.indexOf("?");
  if (qIdx < 0) return { topic: "" };
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  return {
    topic: params.get("topic") ?? "",
    path: params.get("path") ?? undefined,
  };
}

export default function MicroSkillPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  // Listen to hash changes so deep-links still pick up topic if user navigates
  // between micro-skill instances.
  const [{ topic, path }, setQuery] = useState(parseHashQuery());
  useEffect(() => {
    const handler = () => setQuery(parseHashQuery());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  // Allow manual topic entry if none provided in URL.
  const [manualTopic, setManualTopic] = useState("");
  const effectiveTopic = topic || manualTopic;

  const lessonMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await apiRequest("POST", "/api/microskill/generate", { topic: t });
      return (await res.json()) as MicroSkillLesson;
    },
    onError: (err: any) =>
      toast({ title: "Couldn't load the lesson", description: err?.message ?? "", variant: "destructive" }),
  });

  // Auto-fetch on mount when topic exists.
  useEffect(() => {
    if (topic && !lessonMutation.data && !lessonMutation.isPending) {
      lessonMutation.mutate(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const completionsQuery = useQuery<MicroSkillCompletion[]>({
    queryKey: ["/api/microskill", user?.id, "completions"],
    enabled: !!user,
  });

  const completeMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await apiRequest("POST", "/api/microskill/complete", { userId: user!.id, topic: t });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/microskill", user?.id, "completions"] });
    },
  });

  if (!user) return null;

  const lesson = lessonMutation.data;
  const isComplete = useMemo(
    () => (completionsQuery.data ?? []).some((c) => c.topic === effectiveTopic),
    [completionsQuery.data, effectiveTopic],
  );

  return (
    <FrameShell>
      <section className="mb-8">
        <div className="flex items-start gap-3">
          <span className="size-10 rounded-2xl bg-primary/15 text-primary grid place-items-center">
            <Sparkles className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-hand text-primary text-sm">
              micro-skill {path ? `· from ${path.replace("_", "-")} path` : ""}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight" data-testid="text-microskill-title">
              {effectiveTopic || "Pick a tiny skill"}
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Five short steps. Reflect, choose, reflect — then go do the smallest possible rep.
            </p>
          </div>
        </div>
      </section>

      {/* Manual topic entry when no topic in URL */}
      {!topic && !lessonMutation.data && (
        <Card className="p-6 rounded-2xl border-card-border bg-card">
          <p className="text-sm text-muted-foreground mb-3">
            No topic from a career path? Type one — anything you'd like a 5-step warm-up on.
          </p>
          <div className="flex gap-2">
            <Textarea
              value={manualTopic}
              onChange={(e) => setManualTopic(e.target.value)}
              rows={2}
              placeholder="Asking better questions in tutorials"
              className="rounded-2xl bg-background resize-none"
              data-testid="input-manual-topic"
              maxLength={160}
            />
            <Button
              onClick={() => manualTopic.trim() && lessonMutation.mutate(manualTopic.trim())}
              disabled={!manualTopic.trim() || lessonMutation.isPending}
              className="rounded-xl shrink-0"
              data-testid="button-load-lesson"
            >
              {lessonMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Start"}
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {lessonMutation.isPending && (
        <Card className="p-10 rounded-2xl border-card-border bg-card text-center">
          <Loader2 className="size-6 animate-spin text-primary inline-block" />
          <p className="mt-3 font-display text-lg">Shaping your five steps…</p>
        </Card>
      )}

      {/* Lesson */}
      {lesson && !lessonMutation.isPending && (
        <LessonView
          lesson={lesson}
          isComplete={isComplete}
          onComplete={() => completeMutation.mutate(lesson.topic)}
          completing={completeMutation.isPending}
          onRestart={() => lessonMutation.mutate(lesson.topic)}
        />
      )}
    </FrameShell>
  );
}

// ----------------------------------------------------------------------------
function LessonView({
  lesson, isComplete, onComplete, completing, onRestart,
}: {
  lesson: MicroSkillLesson;
  isComplete: boolean;
  onComplete: () => void;
  completing: boolean;
  onRestart: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  const step = lesson.steps[stepIdx];
  const total = lesson.steps.length;
  const currentAnswer = answers[step?.index] ?? "";
  const isLast = stepIdx === total - 1;
  const showHint = revealed[step?.index];

  function selectChoice(opt: string) {
    setAnswers((a) => ({ ...a, [step.index]: opt }));
    setRevealed((r) => ({ ...r, [step.index]: true }));
  }
  function submitReflect() {
    if (!currentAnswer.trim()) return;
    setRevealed((r) => ({ ...r, [step.index]: true }));
  }
  function next() {
    if (!revealed[step.index]) return;
    if (isLast) {
      setDone(true);
      onComplete();
      return;
    }
    setStepIdx(stepIdx + 1);
  }

  return (
    <Card className="p-6 sm:p-8 rounded-3xl border-card-border bg-card">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={stepIdx + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          {lesson.steps.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all duration-300 " +
                (i < stepIdx ? "w-6 bg-primary" : i === stepIdx ? "w-10 bg-primary" : "w-3 bg-secondary")
              }
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground" data-testid="text-step-count">
          Step {stepIdx + 1} of {total}
        </span>
      </div>

      {/* Intro */}
      {stepIdx === 0 && !done && (
        <p className="text-sm text-muted-foreground mb-5" data-testid="text-lesson-intro">
          {lesson.intro}
        </p>
      )}

      {!done && step && (
        <div key={step.index} className="float-in">
          <h2 className="font-display text-xl sm:text-2xl leading-snug" data-testid={`text-step-prompt-${step.index}`}>
            {step.prompt}
          </h2>

          {step.kind === "choice" && step.options ? (
            <div className="mt-5 space-y-2">
              {step.options.map((opt) => {
                const picked = answers[step.index] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => selectChoice(opt)}
                    disabled={!!revealed[step.index]}
                    className={
                      "w-full text-left rounded-2xl border px-4 py-3 transition-all hover-elevate " +
                      (picked
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-card-border bg-background")
                    }
                    data-testid={`button-choice-${step.index}-${opt.slice(0, 16).replace(/\s+/g, "-")}`}
                  >
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5">
              <Textarea
                rows={3}
                value={currentAnswer}
                onChange={(e) => setAnswers((a) => ({ ...a, [step.index]: e.target.value }))}
                placeholder="Type your answer — short is good."
                className="rounded-2xl bg-background resize-none"
                data-testid={`input-reflect-${step.index}`}
                maxLength={500}
                disabled={!!revealed[step.index]}
              />
              {!revealed[step.index] && (
                <Button
                  onClick={submitReflect}
                  disabled={!currentAnswer.trim()}
                  variant="secondary"
                  className="mt-3 rounded-xl"
                  data-testid={`button-submit-reflect-${step.index}`}
                >
                  Save & see the nudge
                </Button>
              )}
            </div>
          )}

          {/* Hint after reveal */}
          {showHint && step.hint && (
            <div className="mt-4 rounded-2xl border-l-4 border-primary/60 bg-accent/30 px-4 py-3 float-in" data-testid={`text-hint-${step.index}`}>
              <p className="font-hand text-primary text-xs mb-0.5">a nudge</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{step.hint}</p>
            </div>
          )}

          {showHint && (
            <div className="mt-6 flex items-center justify-end">
              <Button
                onClick={next}
                className="gap-2 rounded-xl"
                data-testid="button-next-step"
              >
                {isLast ? "Finish" : "Next step"} <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Done state */}
      {done && (
        <div className="text-center py-6 float-in">
          <span className="inline-flex size-12 rounded-2xl bg-primary/15 text-primary items-center justify-center">
            <Check className="size-5" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold">
            That's the rep.
          </h2>
          <p className="mt-2 text-foreground/85 max-w-xl mx-auto leading-relaxed" data-testid="text-lesson-outro">
            {lesson.outro}
          </p>
          {completing ? (
            <p className="mt-4 text-xs text-muted-foreground">Saving…</p>
          ) : isComplete ? (
            <p className="mt-4 text-xs text-primary" data-testid="status-completed">
              ✓ Marked complete on your profile
            </p>
          ) : null}
          <div className="mt-7 flex gap-2 justify-center">
            <Button variant="ghost" onClick={onRestart} className="gap-1.5 rounded-xl" data-testid="button-restart">
              <RefreshCw className="size-3.5" /> Run it again
            </Button>
            <Link href="/career-pathway">
              <Button className="rounded-xl gap-1.5" data-testid="button-back-paths">
                Back to your paths <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Source meta */}
      {!done && (
        <p className="mt-6 text-[11px] uppercase tracking-wider text-muted-foreground">
          Source: {lesson.source === "gemini" ? "Gemini" : "UniVibe deterministic generator"}
        </p>
      )}
    </Card>
  );
}

function FrameShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link
            href="/career-pathway"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            data-testid="link-back-career"
          >
            <ArrowLeft className="size-3.5" /> Back to your paths
          </Link>
          <Logo />
          <div className="w-32" />
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-3xl w-full px-5 sm:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
