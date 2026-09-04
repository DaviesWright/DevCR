"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, MessageSquareText, Phone, Handshake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { sendDirectMessage, logCustomerInteraction } from "@/lib/actions/marketing";
import { relativeTime, orEmpty } from "@/lib/utils";
import type { getCustomerOmnichannelProfile, OmnichannelChannel } from "@/lib/queries/marketing";

type Profile = NonNullable<Awaited<ReturnType<typeof getCustomerOmnichannelProfile>>>;

const CHANNEL_CONFIG: Record<OmnichannelChannel, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: "Email", icon: Mail },
  SMS: { label: "SMS", icon: MessageSquareText },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
  PHONE: { label: "Phone", icon: Phone },
  IN_PERSON: { label: "In Person", icon: Handshake },
};

const RADIUS = 150;

export function OmnichannelView({
  customerId,
  profile,
  currentUserId,
}: {
  customerId: string;
  profile: Profile;
  currentUserId: string;
}) {
  const [activeChannel, setActiveChannel] = React.useState<OmnichannelChannel | null>(null);
  const activeChannelInfo = activeChannel ? profile.channels.find((c) => c.id === activeChannel) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="relative mx-auto flex h-[380px] max-w-md items-center justify-center">
            <div className="z-10 flex size-24 flex-col items-center justify-center rounded-full border-2 border-highlight bg-highlight/10 text-center">
              <span className="font-heading text-lg font-semibold text-highlight">
                {profile.customer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="text-[10px] text-muted-foreground">Customer</span>
            </div>
            {profile.channels.map((ch, i) => {
              const angle = (i / profile.channels.length) * 2 * Math.PI - Math.PI / 2;
              const x = Math.cos(angle) * RADIUS;
              const y = Math.sin(angle) * RADIUS;
              const config = CHANNEL_CONFIG[ch.id];
              const Icon = config.icon;
              const disabled = !ch.available || ch.optedOut;
              return (
                <button
                  key={ch.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`absolute flex flex-col items-center gap-1 rounded-xl border bg-card p-3 transition-transform ${
                    disabled
                      ? "cursor-not-allowed border-border opacity-40"
                      : "cursor-pointer border-border hover:scale-105 hover:border-highlight"
                  } ${ch.preferred ? "ring-2 ring-highlight ring-offset-2 ring-offset-background" : ""}`}
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: "translate(-50%, -50%)" }}
                >
                  <Icon className="size-5" />
                  <span className="text-xs font-medium">{config.label}</span>
                  {ch.interactionCount > 0 && <span className="text-[10px] text-muted-foreground">{ch.interactionCount}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full ring-2 ring-highlight" /> Preferred
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border border-border opacity-40" /> Unavailable / opted out
            </span>
            <span>Click a channel to send a message or log contact</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Interaction timeline</p>
            {profile.timeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No interactions yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {profile.timeline.map((t) => {
                  const config = CHANNEL_CONFIG[t.channel];
                  const Icon = config.icon;
                  return (
                    <div key={t.id} className="flex items-start gap-3 py-2.5">
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{t.label}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(t.occurredAt)}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{orEmpty(t.detail)}</p>
                        {t.by && <p className="text-xs text-muted-foreground">Logged by {t.by}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium text-foreground">Channel stats</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold tabular-nums">{profile.stats.total}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-lg font-semibold tabular-nums">{profile.stats.sent}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Opened</p>
                <p className="text-lg font-semibold tabular-nums">{profile.stats.opened}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Replied</p>
                <p className="text-lg font-semibold tabular-nums">{profile.stats.replied}</p>
              </div>
            </div>
            {Object.keys(profile.stats.byChannel).length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5">
                {Object.entries(profile.stats.byChannel).map(([channel, count]) => (
                  <div key={channel} className="flex items-center gap-2 text-xs">
                    <span className="w-16 shrink-0 text-muted-foreground">
                      {CHANNEL_CONFIG[channel as OmnichannelChannel]?.label ?? channel}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-highlight"
                        style={{ width: `${(count / profile.stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ChannelActionSheet
        channel={activeChannel}
        channelInfo={activeChannelInfo}
        customerId={customerId}
        currentUserId={currentUserId}
        onClose={() => setActiveChannel(null)}
      />
    </div>
  );
}

function ChannelActionSheet({
  channel,
  channelInfo,
  customerId,
  currentUserId,
  onClose,
}: {
  channel: OmnichannelChannel | null;
  channelInfo: Profile["channels"][number] | null;
  customerId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSubject("");
    setBody("");
    setError(null);
  }, [channel]);

  if (!channel) return null;
  const config = CHANNEL_CONFIG[channel];
  const isMessage = channel === "EMAIL" || channel === "SMS" || channel === "WHATSAPP";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    try {
      if (isMessage) {
        await sendDirectMessage(customerId, currentUserId, {
          channel: channel as "EMAIL" | "SMS" | "WHATSAPP",
          subject: channel === "EMAIL" ? subject : undefined,
          body,
        });
      } else {
        await logCustomerInteraction(customerId, {
          type: channel === "PHONE" ? "CALL" : "MEETING",
          subject,
          notes: body,
          actorId: currentUserId,
        });
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete this action.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={!!channel} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isMessage ? `Send via ${config.label}` : `Log ${config.label.toLowerCase()}`}</SheetTitle>
          <SheetDescription>
            {isMessage
              ? "Simulated — no email/SMS/WhatsApp provider is configured; this writes a real message record."
              : "Logged as an Interaction on this customer's record."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          {channelInfo?.optedOut && (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              This customer has opted out of {config.label}.
            </div>
          )}
          <div>
            <Label htmlFor="omniSubject">{isMessage ? "Subject" : "Subject / title"}</Label>
            <Input
              id="omniSubject"
              className="mt-1.5"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={!isMessage ? (channel === "PHONE" ? "Phone call" : "In-person meeting") : undefined}
              disabled={isMessage && channel !== "EMAIL"}
            />
          </div>
          <div>
            <Label htmlFor="omniBody">{isMessage ? "Message *" : "Notes *"}</Label>
            <Textarea id="omniBody" className="mt-1.5" rows={5} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <Button type="submit" disabled={pending || !body.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} {isMessage ? "Send" : "Log"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
