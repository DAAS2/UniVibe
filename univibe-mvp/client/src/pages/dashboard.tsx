import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Users, MessageCircle, ArrowRight, Check, Compass, Heart, LogOut,
} from "lucide-react";
import type { HydratedProfile, HydratedRoom } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const profileQuery = useQuery<HydratedProfile>({
    queryKey: ["/api/profile", user?.id],
    enabled: !!user,
  });

  const groupsQuery = useQuery<HydratedRoom[]>({
    queryKey: ["/api/groups", user?.id],
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await apiRequest("POST", `/api/rooms/${roomId}/join`, { userId: user!.id });
      return res.json();
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", user?.id] });
      navigate(`/room/${roomId}`);
    },
    onError: (err: any) => toast({ title: "Couldn't join", description: err?.message ?? "", variant: "destructive" }),
  });

  if (!user) return null;

  // If profile query 404'd, push to onboarding.
  useEffect(() => {
    if (profileQuery.isError) navigate("/onboarding");
  }, [profileQuery.isError, navigate]);

  const profile = profileQuery.data;
  const groups = groupsQuery.data ?? [];

  return (
    <div className="min-h-screen">
      <header className="px-5 sm:px-8 py-4 border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-greeting">
              hey, {user.displayName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { signOut(); navigate("/"); }}
              className="gap-1.5"
              data-testid="button-signout"
            >
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10 space-y-10">
        {/* Profile card */}
        <section>
          {profileQuery.isLoading ? (
            <Skeleton className="h-44 w-full rounded-3xl" />
          ) : profile ? (
            <Card className="p-7 sm:p-8 rounded-3xl border-card-border shadow-sm bg-card">
              <div className="flex items-start gap-4 flex-wrap">
                <span className="size-12 rounded-2xl bg-primary/15 text-primary grid place-items-center">
                  <Sparkles className="size-5" />
                </span>
                <div className="flex-1 min-w-[260px]">
                  <p className="font-hand text-primary text-sm">your archetype</p>
                  <h1 className="text-3xl sm:text-4xl font-semibold leading-tight" data-testid="text-archetype">
                    {profile.studentArchetype}
                  </h1>
                  <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed" data-testid="text-summary">
                    {profile.onboardingSummary}
                  </p>
                  <p className="mt-3 text-sm text-foreground/80" data-testid="text-social-style">
                    <span className="text-muted-foreground">How you connect: </span>
                    {profile.socialStyle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {profile.personalityTags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-card-border"
                        data-testid={`tag-personality-${t}`}
                      >
                        {t}
                      </span>
                    ))}
                    {profile.interests.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2.5 py-1 rounded-full bg-accent/40 text-accent-foreground border border-card-border"
                        data-testid={`tag-interest-${t}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </section>

        {/* Groups */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-semibold">Your matched rooms</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Six rooms that already feel a little bit like you.
              </p>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {groups.filter((g) => g.joined).length} joined
            </span>
          </div>

          {groupsQuery.isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <Card
                  key={g.id}
                  className="p-5 rounded-2xl border-card-border bg-card flex flex-col hover-elevate transition-all"
                  data-testid={`card-room-${g.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-lg leading-snug" data-testid={`text-room-name-${g.id}`}>
                      {g.name}
                    </h3>
                    <span
                      className="font-mono text-xs text-primary shrink-0 mt-0.5"
                      title="Match score"
                      data-testid={`text-match-${g.id}`}
                    >
                      {g.matchScore}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                    {g.description}
                  </p>
                  <p className="text-xs text-foreground/70 mt-3 italic" data-testid={`text-reason-${g.id}`}>
                    {g.matchReason}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-secondary border border-card-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      <span data-testid={`text-members-${g.id}`}>{g.memberCount} members</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-background border border-card-border capitalize">
                      {g.roomType}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {g.joined ? (
                      <Link href={`/room/${g.id}`} className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full gap-1.5" data-testid={`button-open-${g.id}`}>
                          <MessageCircle className="size-3.5" /> Open chat
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => joinMutation.mutate(g.id)}
                        disabled={joinMutation.isPending}
                        data-testid={`button-join-${g.id}`}
                      >
                        {joinMutation.isPending && joinMutation.variables === g.id ? (
                          "Joining…"
                        ) : (
                          <>
                            <Check className="size-3.5" /> Join room
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Live modules */}
        <section>
          <h2 className="text-2xl font-semibold mb-5">Two more rooms to step into</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <ModuleCard
              to="/campus-vibe"
              icon={<Compass className="size-5" />}
              title="Campus Vibe"
              body="A personalised cultural snapshot of Monash — your map, your day, real student stories, clubs and events ranked for you."
              cta="Explore campus"
              testid="campus-vibe"
            />
            <ModuleCard
              to="/career-pathway"
              icon={<Heart className="size-5" />}
              title="Career Pathway"
              body="Three honest shapes a career could take — traditional, hybrid, non-linear. No LinkedIn pressure. Built from your values."
              cta="Build your pathway"
              testid="career-pathway"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function ModuleCard({
  to, icon, title, body, cta, testid,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  testid: string;
}) {
  return (
    <Card className="p-5 rounded-2xl border-card-border bg-card hover-elevate flex flex-col" data-testid={`card-module-${testid}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="size-9 rounded-xl bg-accent/40 text-accent-foreground grid place-items-center">
            {icon}
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Live
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{body}</p>
      <Link href={to}>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4 gap-1.5 w-full justify-between rounded-xl"
          data-testid={`button-module-${testid}`}
        >
          {cta} <ArrowRight className="size-3.5" />
        </Button>
      </Link>
    </Card>
  );
}
