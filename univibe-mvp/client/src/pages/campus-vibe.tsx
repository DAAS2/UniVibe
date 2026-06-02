import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft, MapPin, CalendarDays, Users, Sparkles, Quote,
} from "lucide-react";

// ----------------------------------------------------------------------------
// Campus Vibe — Monash-only for MVP. The shape is multi-university-ready; the
// backend keys on /api/campus/:userId?university=monash and the catalog is
// stored in server/campus.ts as plain data (no Gemini memory required).
// ----------------------------------------------------------------------------

interface MapPinT {
  id: string; label: string; emoji: string; vibe: string; bestFor: string[];
}
interface Club {
  id: string; name: string; blurb: string; signals: string[]; meetCadence: string;
}
interface Event {
  id: string; title: string; when: string; where: string; blurb: string; signals: string[];
}
interface Story {
  id: string; name: string; course: string; year: string; quote: string; tag: string;
}
interface CampusResponse {
  university: {
    id: string; name: string; shortName: string; city: string;
    tagline: string; cultureSnapshot: string; weeklyRhythm: string[];
  };
  mapPins: MapPinT[];
  clubs: Club[];
  events: Event[];
  stories: Story[];
  narrative: string;
  narrativeSource: "gemini" | "fallback";
  profile: { studentArchetype: string; personalityTags: string[]; interests: string[] };
}

export default function CampusVibePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const campusQuery = useQuery<CampusResponse>({
    queryKey: ["/api/campus", user?.id],
    enabled: !!user,
  });

  if (!user) return null;

  if (campusQuery.isError) {
    return (
      <FrameShell>
        <Card className="p-6 rounded-2xl border-card-border bg-card">
          <p className="text-sm text-muted-foreground">
            We need your onboarding profile to personalise this — finish onboarding first.
          </p>
          <Link href="/onboarding">
            <Button className="mt-4 rounded-xl" data-testid="button-go-onboarding">
              Go to onboarding
            </Button>
          </Link>
        </Card>
      </FrameShell>
    );
  }

  const data = campusQuery.data;

  return (
    <FrameShell>
      {/* HERO */}
      <section className="mb-10">
        {campusQuery.isLoading || !data ? (
          <Skeleton className="h-48 w-full rounded-3xl" />
        ) : (
          <Card className="p-7 sm:p-9 rounded-3xl border-card-border bg-card relative overflow-hidden">
            <div className="flex items-start gap-4 flex-wrap">
              <span className="size-12 rounded-2xl bg-accent/40 text-accent-foreground grid place-items-center">
                <MapPin className="size-5" />
              </span>
              <div className="flex-1 min-w-[260px]">
                <p className="font-hand text-primary text-sm">campus vibe · {data.university.city.toLowerCase()}</p>
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight" data-testid="text-campus-name">
                  Welcome to <span className="squiggle">{data.university.shortName}</span>, {firstName(user.displayName)}.
                </h1>
                <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed" data-testid="text-campus-tagline">
                  {data.university.tagline}
                </p>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed" data-testid="text-culture-snapshot">
                  {data.university.cultureSnapshot}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {data.university.weeklyRhythm.map((r) => (
                    <span
                      key={r}
                      className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-card-border"
                      data-testid={`tag-rhythm-${r}`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* CAMPUS MAP / Culture Snapshot pins */}
      <section className="mb-10">
        <SectionHeading
          icon={<MapPin className="size-4" />}
          eyebrow="campus map"
          title="The vibe at six places you'll find yourself"
          subtitle="Quick cultural snapshot — what each spot actually feels like, not what a brochure says."
        />
        {campusQuery.isLoading || !data ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.mapPins.map((p, idx) => (
              <Card
                key={p.id}
                className="p-4 rounded-2xl border-card-border bg-card hover-elevate"
                data-testid={`card-pin-${p.id}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-snug">{p.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1" data-testid={`text-pin-vibe-${p.id}`}>
                      {p.vibe}
                    </p>
                    {idx < 3 && (
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-primary/80">
                        for your vibe
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* A DAY IN YOUR LIFE — generated narrative */}
      <section className="mb-10">
        <SectionHeading
          icon={<Sparkles className="size-4" />}
          eyebrow="a day in your life"
          title={data ? `Your made-up Thursday at ${data.university.shortName}` : "Your made-up Thursday"}
          subtitle="Generated from your onboarding signals + actual Monash spots. Not a promise, just a possible day."
        />
        {campusQuery.isLoading || !data ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : (
          <Card className="p-6 sm:p-7 rounded-2xl border-card-border bg-card">
            <div className="text-foreground/90 leading-relaxed space-y-4 whitespace-pre-wrap" data-testid="text-day-narrative">
              {data.narrative}
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-wider text-muted-foreground">
              Source: {data.narrativeSource === "gemini" ? "Gemini" : "UniVibe deterministic generator"}
            </p>
          </Card>
        )}
      </section>

      {/* REAL STUDENT STORIES */}
      <section className="mb-10">
        <SectionHeading
          icon={<Quote className="size-4" />}
          eyebrow="real student stories"
          title="People who've already done this"
          subtitle="Five short stories from students who started where you're starting."
        />
        {campusQuery.isLoading || !data ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.stories.map((s) => (
              <Card
                key={s.id}
                className="p-5 rounded-2xl border-card-border bg-card relative"
                data-testid={`card-story-${s.id}`}
              >
                <Quote className="absolute top-4 right-4 size-4 text-primary/40" />
                <p className="text-sm leading-relaxed text-foreground/85" data-testid={`text-quote-${s.id}`}>
                  "{s.quote}"
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-7 rounded-full bg-accent/40 text-accent-foreground grid place-items-center font-semibold text-[11px]">
                    {s.name.slice(0, 1)}
                  </span>
                  <div>
                    <p className="font-medium text-foreground/90">{s.name}</p>
                    <p>{s.year} · {s.course}</p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary border border-card-border text-[10px]">
                    {s.tag}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CLUBS — ranked by interests */}
      <section className="mb-10">
        <SectionHeading
          icon={<Users className="size-4" />}
          eyebrow="clubs ranked for you"
          title="Five clubs that already match your signals"
          subtitle="Ranked by your interests + personality tags. Not a quiz result — a starting point."
        />
        {campusQuery.isLoading || !data ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.clubs.map((c, idx) => (
              <Card
                key={c.id}
                className="p-5 rounded-2xl border-card-border bg-card hover-elevate"
                data-testid={`card-club-${c.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug" data-testid={`text-club-name-${c.id}`}>
                    {c.name}
                  </h3>
                  <span className="font-mono text-[10px] text-primary shrink-0 mt-1 uppercase tracking-wider">
                    #{idx + 1}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {c.blurb}
                </p>
                <p className="mt-3 text-xs text-foreground/70">
                  <span className="text-muted-foreground">Meets:</span> {c.meetCadence}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* EVENTS — ranked by interests */}
      <section className="mb-12">
        <SectionHeading
          icon={<CalendarDays className="size-4" />}
          eyebrow="upcoming events"
          title="Five things actually happening soon"
          subtitle="Ranked by fit. Walk into one of these and you'll meet at least one person you'll see again."
        />
        {campusQuery.isLoading || !data ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <ul className="space-y-3">
            {data.events.map((e) => (
              <li key={e.id}>
                <Card
                  className="p-5 rounded-2xl border-card-border bg-card flex flex-wrap gap-4 items-start"
                  data-testid={`card-event-${e.id}`}
                >
                  <div className="font-mono text-xs text-primary uppercase tracking-wider shrink-0 w-40">
                    {e.when}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="font-semibold leading-snug" data-testid={`text-event-title-${e.id}`}>
                      {e.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{e.where}</p>
                    <p className="text-sm mt-2 text-foreground/85 leading-relaxed">{e.blurb}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FrameShell>
  );
}

function firstName(displayName: string) {
  return (displayName || "friend").split(" ")[0];
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
      <main className="flex-1 mx-auto max-w-5xl w-full px-5 sm:px-8 py-10">
        {children}
      </main>
    </div>
  );
}

function SectionHeading({
  icon, eyebrow, title, subtitle,
}: { icon: React.ReactNode; eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <p className="font-hand text-primary text-sm flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center size-5">{icon}</span>
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-[28px] font-semibold leading-tight mt-1">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
}
