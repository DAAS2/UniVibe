import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ArrowRight, Sparkles, Users, MessageCircle, Compass, Heart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-4 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" size="sm" data-testid="link-login">
                Log in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" data-testid="link-signup">
                Start your journey
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-16">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <h1 className="text-[2.6rem] sm:text-[3.4rem] lg:text-[3.9rem] leading-[1.02] font-semibold tracking-tight">
              Find your people <br />
              <span className="squiggle">before Day 1.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              UniVibe is a soft-landing space for new uni students. Take a 2-minute AI
              onboarding, get matched into warm peer rooms, and walk onto campus already
              feeling seen, connected, and a little less scared.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2 text-base px-6 py-6 rounded-2xl shadow-sm" data-testid="button-hero-start">
                  Start your journey
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/auth/demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-6 py-6 rounded-2xl bg-card"
                  data-testid="button-hero-demo"
                >
                  Continue as demo student
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-hand">
              Takes 2 minutes · no spam · warm by design
            </p>
          </div>

          {/* Hero illustration — letter-style preview */}
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-primary/15 via-transparent to-accent/30 rounded-[2rem] blur-2xl -z-10" />
            <Card className="relative p-6 sm:p-7 rounded-3xl border-card-border shadow-lg bg-card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="inline-block size-7 rounded-full bg-primary/15 text-primary grid place-items-center font-display font-semibold">
                    AI
                  </span>
                  <span>Onboarding</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="size-1.5 rounded-full bg-primary/40" />
                  <span className="size-1.5 rounded-full bg-primary/40" />
                  <span className="size-1.5 rounded-full bg-primary/20" />
                  <span className="size-1.5 rounded-full bg-primary/20" />
                </div>
              </div>
              <p className="font-display text-xl leading-snug">
                What's something you love doing that you've never been graded on?
              </p>
              <div className="mt-5 rounded-2xl bg-secondary/60 border border-card-border px-4 py-3 text-sm">
                Making weird playlists for my friends. I take it way too seriously.
              </div>
              <div className="mt-6 pt-5 border-t border-card-border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Your matched rooms
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between gap-2">
                    <span>🎧 Music Makers Room</span>
                    <span className="font-mono text-xs text-primary">94%</span>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span>📖 Film & Philosophy Crowd</span>
                    <span className="font-mono text-xs text-primary">87%</span>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span>🌱 Open-Hearted Newcomers</span>
                    <span className="font-mono text-xs text-primary">82%</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Sparkles className="size-5" />}
            tag="01 · AI onboarding"
            title="A 2-min chat, not a form."
            body="Seven warm questions. Your answers become a profile — personality tags, interests, and a student archetype that actually sounds like you."
          />
          <FeatureCard
            icon={<Users className="size-5" />}
            tag="02 · Matched rooms"
            title="Real people, not algorithms in disguise."
            body="Get matched into 5–6 interest rooms and cohort rooms with people who already share your vibe. Each one comes with a reason."
          />
          <FeatureCard
            icon={<MessageCircle className="size-5" />}
            tag="03 · Group chat"
            title="Start talking before move-in."
            body="Every room is alive on Day 0. Drop a hello. Make a plan. Find the friend who'll save you a seat in the front row."
          />
        </div>
      </section>

      {/* Coming next */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-semibold">Coming next</h2>
          <span className="text-sm text-muted-foreground">After your rooms feel like home</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <ComingSoonCard
            icon={<Compass className="size-5" />}
            title="Campus Vibe"
            body="Daily moods, group meetups, photo dumps, and an honest feed of what campus actually feels like this week."
          />
          <ComingSoonCard
            icon={<Heart className="size-5" />}
            title="Career Pathway"
            body="A future-readiness companion that maps your strengths to real opportunities — without the LinkedIn-shaped pressure."
          />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-5 sm:px-8 py-20 text-center">
        <p className="font-hand text-primary mb-2">— a note from us</p>
        <h2 className="text-2xl sm:text-4xl font-semibold leading-tight">
          You're not late. You're not behind. You just haven't met your people yet.
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          UniVibe is built for that quiet ache of starting something new. We'll meet you where you are.
        </p>
        <div className="mt-8">
          <Link href="/auth/signup">
            <Button size="lg" className="gap-2 text-base px-6 py-6 rounded-2xl" data-testid="button-footer-start">
              Find your people <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <Logo />
          <p>Made with care for new students · Canva Hackathon MVP</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon, tag, title, body,
}: { icon: React.ReactNode; tag: string; title: string; body: string }) {
  return (
    <Card className="p-6 rounded-2xl border-card-border bg-card hover-elevate transition-all" data-testid={`card-feature-${tag.split(" ")[0]}`}>
      <div className="flex items-center gap-2 text-primary mb-4">
        <span className="size-9 rounded-xl bg-primary/12 grid place-items-center">{icon}</span>
        <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">{tag}</span>
      </div>
      <h3 className="text-lg font-semibold leading-snug">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}

function ComingSoonCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-6 rounded-2xl border-dashed border-card-border bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="size-9 rounded-xl bg-accent/40 text-accent-foreground grid place-items-center">{icon}</span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-card-border">
          Next challenge
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}
