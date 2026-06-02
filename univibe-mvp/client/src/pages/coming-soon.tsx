import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Compass, Heart } from "lucide-react";

/**
 * Generic placeholder for the two future modules (Campus Vibe, Career Pathway).
 *
 * To replace this with a real implementation, add a new page in `client/src/pages/`
 * and register it in `App.tsx`. The dashboard already links here via /#/coming-soon/{key}.
 * Backend extension: add new routes under /api/campus or /api/career and reuse
 * the same auth + profile pattern (pass userId via React state).
 */

const MODULES: Record<string, { title: string; icon: React.ReactNode; tagline: string; body: string[] }> = {
  "campus-vibe": {
    title: "Campus Vibe",
    icon: <Compass className="size-5" />,
    tagline: "A daily pulse of what campus actually feels like.",
    body: [
      "Drop a mood, share a photo from your week, find tonight's small meetups. An honest, low-pressure feed for the people you've already matched with.",
      "We're shipping this after MVP — the data model and routing are set up so adding it doesn't disturb onboarding, rooms, or chat.",
    ],
  },
  "career-pathway": {
    title: "Career Pathway",
    icon: <Heart className="size-5" />,
    tagline: "Future-readiness without the LinkedIn pressure.",
    body: [
      "Map your strengths from your onboarding answers into real next steps — internships, side projects, study tracks — at your pace, in plain language.",
      "Coming in the next challenge. Your profile already carries the signals we'll use.",
    ],
  },
};

export default function ComingSoonPage({ params }: { params: { key: string } }) {
  const mod = MODULES[params.key] ?? MODULES["campus-vibe"];
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-dashboard">
              <ArrowLeft className="size-3.5" /> Back
            </a>
          </Link>
          <Logo />
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl w-full px-5 py-16">
        <Card className="p-8 rounded-3xl border-dashed border-card-border bg-card text-center">
          <span className="inline-flex size-12 rounded-2xl bg-accent/40 text-accent-foreground items-center justify-center mb-4">
            {mod.icon}
          </span>
          <p className="font-hand text-primary text-sm mb-1">next challenge</p>
          <h1 className="text-3xl font-semibold" data-testid="text-coming-title">{mod.title}</h1>
          <p className="mt-2 text-muted-foreground">{mod.tagline}</p>
          <div className="mt-6 space-y-3 text-sm text-foreground/80 text-left max-w-prose mx-auto">
            {mod.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link href="/dashboard">
            <Button className="mt-7 rounded-xl" data-testid="button-back-rooms">Back to your rooms</Button>
          </Link>
        </Card>
      </main>
    </div>
  );
}
