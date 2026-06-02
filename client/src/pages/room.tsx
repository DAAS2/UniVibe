import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Users } from "lucide-react";
import type { HydratedRoom, Message } from "@shared/schema";

export default function RoomPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute<{ id: string }>("/room/:id");
  const roomId = params?.id;

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const roomQuery = useQuery<HydratedRoom>({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
  });

  // NOTE: Polling every 4s simulates Realtime. Swap to Supabase Realtime
  // by subscribing to room_messages channel and pushing into the query cache.
  const messagesQuery = useQuery<Message[]>({
    queryKey: ["/api/rooms", roomId, "messages"],
    enabled: !!roomId,
    refetchInterval: 4000,
  });

  const [draft, setDraft] = useState("");
  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiRequest("POST", `/api/rooms/${roomId}/messages`, {
        userId: user!.id,
        body,
      });
      return res.json();
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "messages"] });
    },
    onError: (err: any) =>
      toast({ title: "Couldn't send", description: err?.message ?? "", variant: "destructive" }),
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messagesQuery.data?.length]);

  const presence = useMemo(() => {
    // Deterministic "X online" count derived from member count.
    const m = roomQuery.data?.memberCount ?? 0;
    return Math.max(2, Math.min(12, Math.round(m * 0.07) + 2));
  }, [roomQuery.data?.memberCount]);

  if (!user) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-dashboard">
              <ArrowLeft className="size-3.5" /> Rooms
            </a>
          </Link>
          <Logo />
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-5 sm:px-6 py-6 flex flex-col">
        {/* Room header */}
        {roomQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl mb-5" />
        ) : roomQuery.data ? (
          <Card className="p-5 rounded-2xl border-card-border bg-card mb-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold leading-tight" data-testid="text-room-name">
                  {roomQuery.data.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {roomQuery.data.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roomQuery.data.tags.map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-secondary border border-card-border">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1.5" data-testid="text-presence">
                  <span className="relative inline-flex">
                    <span className="size-2 rounded-full bg-status-online" />
                    <span className="absolute inset-0 size-2 rounded-full bg-status-online animate-ping opacity-60" />
                  </span>
                  {presence} people online
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {roomQuery.data.memberCount} members
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-2xl border border-card-border bg-card/60 px-4 sm:px-6 py-5 space-y-4 min-h-[420px]"
          data-testid="list-messages"
        >
          {messagesQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-3/4 rounded-2xl" />
              <Skeleton className="h-14 w-2/3 rounded-2xl" />
              <Skeleton className="h-14 w-3/5 rounded-2xl" />
            </div>
          ) : (messagesQuery.data ?? []).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              It's quiet in here. Say hi — someone's waiting.
            </p>
          ) : (
            (messagesQuery.data ?? []).map((m) => (
              <MessageBubble key={m.id} m={m} isMine={!!m.isUser && m.authorName === user.displayName} />
            ))
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something warm…"
            className="bg-background rounded-2xl"
            maxLength={800}
            data-testid="input-message"
          />
          <Button
            type="submit"
            disabled={!draft.trim() || sendMutation.isPending}
            className="gap-1.5 rounded-2xl"
            data-testid="button-send"
          >
            <Send className="size-4" /> Send
          </Button>
        </form>
      </main>
    </div>
  );
}

function MessageBubble({ m, isMine }: { m: Message; isMine: boolean }) {
  if (m.isSystem) {
    return (
      <div className="text-center" data-testid={`message-system-${m.id}`}>
        <p className="inline-block max-w-xl text-sm text-muted-foreground bg-accent/30 border border-card-border rounded-2xl px-4 py-3 font-hand">
          {m.body}
        </p>
      </div>
    );
  }
  return (
    <div className={"flex items-start gap-2.5 " + (isMine ? "flex-row-reverse" : "")} data-testid={`message-${m.id}`}>
      <span
        className={
          "size-8 shrink-0 rounded-full grid place-items-center font-semibold text-xs " +
          (isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")
        }
        aria-hidden="true"
      >
        {m.authorName.slice(0, 2).toUpperCase()}
      </span>
      <div className={"max-w-[78%] " + (isMine ? "items-end text-right" : "")}>
        <div className={"flex items-center gap-1.5 text-xs " + (isMine ? "justify-end" : "")}>
          <span className="font-medium">{m.authorName}</span>
          <span className="text-muted-foreground">· {m.authorTag}</span>
        </div>
        <div
          className={
            "mt-1 inline-block text-sm leading-relaxed px-4 py-2.5 rounded-2xl " +
            (isMine
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-background border border-card-border rounded-tl-md")
          }
        >
          {m.body}
        </div>
      </div>
    </div>
  );
}
