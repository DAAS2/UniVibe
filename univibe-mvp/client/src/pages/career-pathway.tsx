import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Compass, Loader2, RefreshCw, Sparkles, BookOpen, Building2, Wrench,
} from "lucide-react";

// ----------------------------------------------------------------------------
// Career Pathway Builder.
// Two phases held in React state (no browser storage):
//   1. Intake (degree + 3-5 values answers)
//   2. Result (3 pathway cards: Traditional, Hybrid, Non-Linear)
// Latest result is also persisted server-side so users can revisit.
// ----------------------------------------------------------------------------

export interface CareerPath {
  kind: "traditional" | "hybrid" | "non_linear";
  title: string;
  description: string;
  roles: string[];
  skills: string[];
  companies: string[];
  micro_skill_topic: string;
}
export interface CareerResult {
  degree: string;
  paths: CareerPath[];
  encouragement: string;
  source: "gemini" | "fallback";
}
interface CareerLatest {
  degree: string;
  values: string[];
  result: CareerResult;
  createdAt: number;
}

const VALUE_QUESTIONS = [
  {
    q: "What kind of impact do you want your work to have on people, day to day?",
    placeholder: "I'd want it to help people quietly — not save the world, just lighten someone's week.",
  },
  {
    q: "How important is stability vs freedom for you, honestly?",
    placeholder: "Probably more stability than I'd admit out loud — but I want creative freedom inside it.",
  },
  {
    q: "What's one thing you'd absolutely refuse to spend 8 hours a day on?",
    placeholder: "Sending follow-up emails about follow-up emails.",
  },
  {
    q: "If money wasn't a factor, what kind of work would still feel meaningful?",
    placeholder: "Designing physical objects. Or teaching.",
  },
  {
    q: "Who do you secretly look at and think: \"I'd want a version of that life\"?",
    placeholder: "An old uni friend who runs a small studio and writes a newsletter on Sundays.",
  },
];

export default function CareerPathwayPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  // Try fetch latest run.
  const latestQuery = useQuery<CareerLatest>({
    queryKey: ["/api/career", user?.id, "latest"],
    enabled: !!user,
  });

  // Intake state
  const [degree, setDegree] = useState("");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [showIntake, setShowIntake] = useState(false);

  // When latest exists, default to result view.
  useEffect(() => {
    if (latestQuery.data) setShowIntake(false);
    if (latestQuery.isError) setShowIntake(true);
  }, [latestQuery.data, latestQuery.isError]);

  const generateMutation = useMutation({
    mutationFn: async (payload: { degree: string; values: string[] }) => {
      const res = await apiRequest("POST", "/api/career/generate", {
        userId: user!.id,
        degree: payload.degree,
        values: payload.values,
      });
      return (await res.json()) as CareerResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/career", user?.id, "latest"] });
      setShowIntake(false);
    },
    onError: (err: any) =>
      toast({
        title: "Couldn't generate your paths",
        description: err?.message ?? "Try again in a moment.",
        variant: "destructive",
      }),
  });

  if (!user) return null;

  // Choose what to render: result vs. intake
  const showResult = !showIntake && (latestQuery.data || generateMutation.data);
  const result: CareerResult | undefined =
    generateMutation.data ?? latestQuery.data?.result;
  const resultDegree =
    generateMutation.data ? generateMutation.variables?.degree : latestQuery.data?.degree;

  function nextIntake() {
    if (step === 0) {
      if (!degree.trim()) return;
      setStep(1);
      setDraft("");
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) return;
    const updated = [...answers, trimmed];
    setAnswers(updated);
    setDraft("");
    if (step < VALUE_QUESTIONS.length) {
      setStep(step + 1);
    }
  }

  function finish() {
    const trimmed = draft.trim();
    const updated = trimmed && step >= 1 && step <= VALUE_QUESTIONS.length ? [...answers, trimmed] : answers;
    if (updated.length < 3) {
      toast({
        title: "A few more thoughts",
        description: "Answer at least 3 questions to get a thoughtful path.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({ degree, values: updated });
  }

  return (
    <FrameShell>
      {/* Hero */}
      <section className="mb-8">
        <div className="flex items-start gap-3">
          <span className="size-10 rounded-2xl bg-primary/15 text-primary grid place-items-center">
            <Compass className="size-5" />
          </span>
          <div>
            <p className="font-hand text-primary text-sm">career pathway</p>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
              Three honest shapes a career <span className="squiggle">could</span> take.
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Traditional, hybrid, non-linear. No LinkedIn pressure. Pick the one that fits this year — the next can look totally different.
            </p>
          </div>
        </div>
      </section>

      {/* If still loading the latest run, show a skeleton */}
      {latestQuery.isLoading && !showIntake && !generateMutation.data && (
        <Skeleton className="h-64 rounded-2xl" />
      )}

      {/* INTAKE */}
      {showIntake && !generateMutation.isPending && (
        <Intake
          degree={degree}
          setDegree={setDegree}
          step={step}
          setStep={setStep}
          draft={draft}
          setDraft={setDraft}
          answers={answers}
          onNext={nextIntake}
          onFinish={finish}
          submitting={generateMutation.isPending}
        />
      )}

      {/* GENERATING */}
      {generateMutation.isPending && (
        <Card className="p-10 rounded-2xl border-card-border bg-card text-center">
          <Loader2 className="size-6 animate-spin text-primary inline-block" />
          <p className="mt-3 font-display text-lg">Reading your values, sketching three shapes…</p>
          <p className="mt-1 text-sm text-muted-foreground">Takes a few seconds.</p>
        </Card>
      )}

      {/* RESULT */}
      {showResult && result && (
        <ResultView
          result={result}
          degree={resultDegree ?? ""}
          onRegenerate={() => {
            setShowIntake(true);
            setStep(0);
            setDegree("");
            setDraft("");
            setAnswers([]);
            generateMutation.reset();
          }}
        />
      )}
    </FrameShell>
  );
}

// ----------------------------------------------------------------------------
// Intake — degree first, then 3-5 values questions.
// ----------------------------------------------------------------------------
function Intake({
  degree, setDegree, step, setStep, draft, setDraft, answers, onNext, onFinish, submitting,
}: {
  degree: string;
  setDegree: (v: string) => void;
  step: number;
  setStep: (v: number) => void;
  draft: string;
  setDraft: (v: string) => void;
  answers: string[];
  onNext: () => void;
  onFinish: () => void;
  submitting: boolean;
}) {
  const totalSteps = 1 + VALUE_QUESTIONS.length; // 1 degree + N values
  const valueIdx = step - 1;
  const currentQuestion =
    step === 0 || valueIdx >= VALUE_QUESTIONS.length ? null : VALUE_QUESTIONS[valueIdx];
  const isLast = step >= VALUE_QUESTIONS.length;

  return (
    <Card className="p-6 sm:p-8 rounded-3xl border-card-border bg-card">
      <div className="flex items-center gap-1.5 mb-6" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={
              "h-1.5 rounded-full transition-all duration-300 " +
              (i < step ? "w-6 bg-primary" : i === step ? "w-10 bg-primary" : "w-3 bg-secondary")
            }
          />
        ))}
      </div>

      {step === 0 ? (
        <div className="float-in">
          <div className="flex items-start gap-3">
            <span className="size-9 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center">
              <Sparkles className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">First — quick context.</p>
              <h2 className="font-display text-lg sm:text-xl leading-snug mt-1">
                What are you studying? (Or about to study?)
              </h2>
              <Input
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. Bachelor of Design, Monash"
                className="mt-4 rounded-xl"
                data-testid="input-degree"
                maxLength={120}
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">A few words is enough.</span>
                <Button
                  onClick={onNext}
                  disabled={!degree.trim()}
                  className="gap-2 rounded-xl"
                  data-testid="button-degree-next"
                >
                  Next <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : currentQuestion ? (
        <div key={step} className="float-in">
          <div className="flex items-start gap-3">
            <span className="size-9 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center">
              <Sparkles className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Question {step} of {VALUE_QUESTIONS.length} — answer 3+ and stop whenever.</p>
              <h2 className="font-display text-lg sm:text-xl leading-snug mt-1" data-testid={`text-value-question-${step}`}>
                {currentQuestion.q}
              </h2>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={currentQuestion?.placeholder}
                rows={3}
                className="mt-4 rounded-2xl bg-background resize-none text-base"
                maxLength={280}
                data-testid={`input-value-${step}`}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {answers.length >= 3 ? "Ready when you are." : `Need at least ${3 - answers.length} more.`}
                </span>
                <div className="flex gap-2">
                  {answers.length >= 3 && (
                    <Button
                      variant="secondary"
                      onClick={onFinish}
                      disabled={submitting}
                      className="rounded-xl"
                      data-testid="button-finish-early"
                    >
                      Build my paths
                    </Button>
                  )}
                  {!isLast ? (
                    <Button
                      onClick={onNext}
                      disabled={!draft.trim()}
                      className="gap-2 rounded-xl"
                      data-testid={`button-next-value-${step}`}
                    >
                      Next <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={onFinish}
                      disabled={!draft.trim() && answers.length < 3}
                      className="gap-2 rounded-xl"
                      data-testid="button-finish"
                    >
                      Build my paths <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Recap */}
          {answers.length > 0 && (
            <ul className="mt-8 space-y-2 pl-12 opacity-75">
              {answers.map((a, i) => (
                <li key={i} className="text-sm flex items-start gap-2" data-testid={`text-answer-${i}`}>
                  <span className="size-5 rounded-full bg-secondary grid place-items-center text-[11px] font-medium shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="line-clamp-2">{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        // All questions answered — single "finish" prompt.
        <div className="float-in text-center py-6">
          <p className="font-display text-xl">That's plenty.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            You've answered all {VALUE_QUESTIONS.length} questions. Ready to see your three paths?
          </p>
          <Button
            onClick={onFinish}
            disabled={submitting}
            className="mt-5 gap-2 rounded-xl"
            data-testid="button-finish-all"
          >
            Build my paths <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Result — three pathway cards.
// ----------------------------------------------------------------------------
const KIND_META: Record<CareerPath["kind"], { label: string; tagline: string }> = {
  traditional: { label: "Traditional", tagline: "The well-marked road." },
  hybrid:      { label: "Hybrid",      tagline: "Half-structure, twice the surface area." },
  non_linear:  { label: "Non-Linear",  tagline: "Build your own shape." },
};

function ResultView({
  result, degree, onRegenerate,
}: { result: CareerResult; degree: string; onRegenerate: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <p className="text-sm text-muted-foreground" data-testid="text-result-context">
          For <span className="text-foreground font-medium">{degree}</span> — three honest shapes:
        </p>
        <Button variant="ghost" size="sm" onClick={onRegenerate} className="gap-1.5" data-testid="button-regenerate">
          <RefreshCw className="size-3.5" /> Re-answer
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {result.paths.map((p, idx) => (
          <PathCard key={p.kind} path={p} index={idx} />
        ))}
      </div>

      <Card className="mt-6 p-5 rounded-2xl border-dashed border-card-border bg-card/70">
        <p className="text-sm text-foreground/85 leading-relaxed" data-testid="text-encouragement">
          {result.encouragement}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          Source: {result.source === "gemini" ? "Gemini" : "UniVibe deterministic generator"}
        </p>
      </Card>
    </>
  );
}

function PathCard({ path, index }: { path: CareerPath; index: number }) {
  const meta = KIND_META[path.kind];
  const accentTone =
    path.kind === "traditional" ? "bg-primary/12 text-primary" :
    path.kind === "hybrid"      ? "bg-accent/40 text-accent-foreground" :
                                  "bg-secondary text-secondary-foreground";

  return (
    <Card
      className="p-6 rounded-2xl border-card-border bg-card flex flex-col"
      data-testid={`card-path-${path.kind}`}
    >
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${accentTone}`}>
          path {index + 1} · {meta.label}
        </span>
        <span className="font-hand text-primary/80 text-xs">{meta.tagline}</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-snug" data-testid={`text-path-title-${path.kind}`}>
        {path.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed" data-testid={`text-path-desc-${path.kind}`}>
        {path.description}
      </p>

      <div className="mt-5">
        <SubHead icon={<BookOpen className="size-3.5" />} label="Roles" />
        <div className="flex flex-wrap gap-1.5">
          {path.roles.map((r) => (
            <span key={r} className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-card-border">{r}</span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <SubHead icon={<Wrench className="size-3.5" />} label="Skills" />
        <div className="flex flex-wrap gap-1.5">
          {path.skills.map((s) => (
            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-accent/40 text-accent-foreground border border-card-border">{s}</span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <SubHead icon={<Building2 className="size-3.5" />} label="Example places" />
        <ul className="text-sm text-foreground/80 space-y-0.5">
          {path.companies.map((c) => (
            <li key={c} className="leading-snug">· {c}</li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-5">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Tiny next skill</p>
        <Link href={`/micro-skill?topic=${encodeURIComponent(path.micro_skill_topic)}&path=${path.kind}`}>
          <Button className="w-full justify-between rounded-xl gap-1.5" data-testid={`button-micro-${path.kind}`}>
            <span className="text-left text-sm font-medium truncate">{path.micro_skill_topic}</span>
            <ArrowRight className="size-4 shrink-0" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function SubHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
      {icon} {label}
    </p>
  );
}

function FrameShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            data-testid="link-back-dashboard"
          >
            <ArrowLeft className="size-3.5" /> Back to your rooms
          </Link>
          <Logo />
          <div className="w-32" />
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-5xl w-full px-5 sm:px-8 py-10">{children}</main>
    </div>
  );
}
