"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Sparkles, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { updateCustomerMarketingPrefs } from "@/lib/actions/marketing";
import { relativeTime, orEmpty } from "@/lib/utils";
import type { getCustomerMarketingProfile } from "@/lib/queries/marketing";

type MarketingProfile = NonNullable<Awaited<ReturnType<typeof getCustomerMarketingProfile>>>;

const SENTIMENT_VARIANT: Record<string, "success" | "secondary" | "destructive"> = {
  POSITIVE: "success",
  NEUTRAL: "secondary",
  NEGATIVE: "destructive",
};

export function CustomerMarketingPanel({
  customerId,
  profile,
  currentUserId,
}: {
  customerId: string;
  profile: MarketingProfile;
  currentUserId: string;
}) {
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Marketing</CardTitle>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/customers/${customerId}/channels`}>
              <Radio className="size-3.5" /> Omnichannel
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Engagement</p>
            <p className="text-lg font-semibold tabular-nums">{profile.engagementScore.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sentiment</p>
            <Badge variant={SENTIMENT_VARIANT[profile.sentiment] ?? "secondary"}>{profile.sentiment.toLowerCase()}</Badge>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last contact</p>
            <p className="text-sm text-foreground">{profile.lastMarketingContactAt ? relativeTime(profile.lastMarketingContactAt) : "--"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Opt-outs</p>
            <p className="text-sm text-foreground">
              {[profile.optOutEmail && "Email", profile.optOutSms && "SMS", profile.optOutWhatsapp && "WhatsApp"].filter(Boolean).join(", ") || "None"}
            </p>
          </div>
        </div>

        {profile.segments.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Segments</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.segments.map((s) => (
                <Badge key={s.id} variant="outline">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.personaSignals.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Suspected personas (from Sales)</p>
            <div className="flex flex-col gap-1.5">
              {profile.personaSignals.map((p) => (
                <div key={p.leadId} className="flex items-start gap-1.5 text-sm">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-highlight" />
                  <div>
                    <span className="font-medium text-foreground">{p.suspectedPersona}</span>
                    {p.note && <span className="text-muted-foreground"> — {p.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.recentMessages.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent messages</p>
            <div className="flex flex-col divide-y divide-border">
              {profile.recentMessages.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-foreground">
                    {m.channel} · {orEmpty(m.subject)} {m.campaignName ? `(${m.campaignName})` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">{m.sentAt ? relativeTime(m.sentAt) : m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <EditMarketingPrefsSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        customerId={customerId}
        profile={profile}
        currentUserId={currentUserId}
      />
    </Card>
  );
}

function EditMarketingPrefsSheet({
  open,
  onOpenChange,
  customerId,
  profile,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  profile: MarketingProfile;
  currentUserId: string;
}) {
  const router = useRouter();
  const [sentiment, setSentiment] = React.useState(profile.sentiment);
  const [optOutEmail, setOptOutEmail] = React.useState(profile.optOutEmail);
  const [optOutSms, setOptOutSms] = React.useState(profile.optOutSms);
  const [optOutWhatsapp, setOptOutWhatsapp] = React.useState(profile.optOutWhatsapp);
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await updateCustomerMarketingPrefs(customerId, currentUserId, { sentiment, optOutEmail, optOutSms, optOutWhatsapp });
    router.refresh();
    setPending(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit marketing preferences</SheetTitle>
          <SheetDescription>Opt-outs are respected by campaign sends and journey steps for the matching channel.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>Sentiment</Label>
            <Select value={sentiment} onValueChange={(v) => setSentiment(v as typeof profile.sentiment)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POSITIVE">Positive</SelectItem>
                <SelectItem value="NEUTRAL">Neutral</SelectItem>
                <SelectItem value="NEGATIVE">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2.5">
            <Label>Opt out of</Label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={optOutEmail} onCheckedChange={(v) => setOptOutEmail(!!v)} /> Email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={optOutSms} onCheckedChange={(v) => setOptOutSms(!!v)} /> SMS
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={optOutWhatsapp} onCheckedChange={(v) => setOptOutWhatsapp(!!v)} /> WhatsApp
            </label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Save
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
