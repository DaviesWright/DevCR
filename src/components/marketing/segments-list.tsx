"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createMarketingSegment } from "@/lib/actions/marketing";
import { relativeTime } from "@/lib/utils";
import type { getMarketingSegments } from "@/lib/queries/marketing";

type Segment = Awaited<ReturnType<typeof getMarketingSegments>>[number];

const NONE = "__none__";
const BUYER_SEGMENTS = ["LOCAL_RESIDENTIAL", "DIASPORA", "CORPORATE", "INVESTOR"];
const KYC_STATUSES = ["PENDING", "VERIFIED", "REJECTED"];
const SENTIMENTS = ["POSITIVE", "NEUTRAL", "NEGATIVE"];
const LIST_CHANNELS = ["EMAIL", "SMS", "WHATSAPP", "CALL"];
export const CHANNEL_LABEL: Record<string, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  CALL: "Calls",
};

export function SegmentsList({ segments, currentUserId }: { segments: Segment[]; currentUserId: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New segment / list
        </Button>
      </div>

      {segments.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No segments or lists yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {segments.map((s) => (
            <Link key={s.id} href={`/marketing/segments/${s.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-base font-semibold text-foreground">{s.name}</p>
                    <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Users className="size-3.5 text-muted-foreground" /> {s.memberCount}
                    </span>
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!s.isDynamic && <Badge variant="outline">Manual list</Badge>}
                    {s.channel && <Badge variant="secondary">{CHANNEL_LABEL[s.channel] ?? s.channel}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.isDynamic
                      ? s.lastComputedAt
                        ? `Refreshed ${relativeTime(s.lastComputedAt)}`
                        : "Not yet computed"
                      : "Hand-picked"}
                    {s.createdBy ? ` · by ${s.createdBy}` : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <NewSegmentSheet open={open} onOpenChange={setOpen} currentUserId={currentUserId} />
    </div>
  );
}

function NewSegmentSheet({
  open,
  onOpenChange,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [listType, setListType] = React.useState<"DYNAMIC" | "MANUAL">("DYNAMIC");
  const [channel, setChannel] = React.useState(NONE);
  const [buyerSegment, setBuyerSegment] = React.useState(NONE);
  const [kycStatus, setKycStatus] = React.useState(NONE);
  const [sentiment, setSentiment] = React.useState(NONE);
  const [minEngagementScore, setMinEngagementScore] = React.useState("");
  const [reservationExpiringWithinDays, setReservationExpiringWithinDays] = React.useState("");
  const [birthdayWithinDays, setBirthdayWithinDays] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function reset() {
    setName("");
    setDescription("");
    setListType("DYNAMIC");
    setChannel(NONE);
    setBuyerSegment(NONE);
    setKycStatus(NONE);
    setSentiment(NONE);
    setMinEngagementScore("");
    setReservationExpiringWithinDays("");
    setBirthdayWithinDays("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    const { segmentId } = await createMarketingSegment({
      name,
      description,
      createdById: currentUserId,
      isDynamic: listType === "DYNAMIC",
      channel: channel === NONE ? undefined : channel,
      criteria: {
        buyerSegment: buyerSegment === NONE ? undefined : buyerSegment,
        kycStatus: kycStatus === NONE ? undefined : kycStatus,
        sentiment: sentiment === NONE ? undefined : sentiment,
        minEngagementScore: minEngagementScore ? Number(minEngagementScore) : undefined,
        reservationExpiringWithinDays: reservationExpiringWithinDays ? Number(reservationExpiringWithinDays) : undefined,
        birthdayWithinDays: birthdayWithinDays ? Number(birthdayWithinDays) : undefined,
      },
    });
    reset();
    setPending(false);
    onOpenChange(false);
    router.push(`/marketing/segments/${segmentId}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New segment / list</SheetTitle>
          <SheetDescription>
            {listType === "DYNAMIC"
              ? "A saved audience. Membership recomputes now, and again whenever you hit \"Refresh\"."
              : "A hand-picked list — starts empty, then add customers one by one on the next screen."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="segmentName">Name *</Label>
            <Input id="segmentName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. This week's call list" />
          </div>
          <div>
            <Label htmlFor="segmentDescription">Description</Label>
            <Textarea id="segmentDescription" className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>List type</Label>
              <Select value={listType} onValueChange={(v) => setListType(v as "DYNAMIC" | "MANUAL")}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DYNAMIC">Dynamic segment (rule-based)</SelectItem>
                  <SelectItem value="MANUAL">Manual list (hand-picked)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Any / general purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Any / general purpose</SelectItem>
                  {LIST_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CHANNEL_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {listType === "DYNAMIC" && (
          <div className="rounded-md border border-border p-3">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Criteria (all optional, ANDed)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Buyer segment</Label>
                <Select value={buyerSegment} onValueChange={setBuyerSegment}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Any</SelectItem>
                    {BUYER_SEGMENTS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>KYC status</Label>
                <Select value={kycStatus} onValueChange={setKycStatus}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Any</SelectItem>
                    {KYC_STATUSES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sentiment</Label>
                <Select value={sentiment} onValueChange={setSentiment}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Any</SelectItem>
                    {SENTIMENTS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minEngagement">Min. engagement score</Label>
                <Input
                  id="minEngagement"
                  type="number"
                  min="0"
                  max="100"
                  className="mt-1.5"
                  value={minEngagementScore}
                  onChange={(e) => setMinEngagementScore(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reservationExpiring">Reservation expiring within (days)</Label>
                <Input
                  id="reservationExpiring"
                  type="number"
                  min="0"
                  className="mt-1.5"
                  value={reservationExpiringWithinDays}
                  onChange={(e) => setReservationExpiringWithinDays(e.target.value)}
                  placeholder="e.g. 7"
                />
              </div>
              <div>
                <Label htmlFor="birthdayWithin">Birthday within (days)</Label>
                <Input
                  id="birthdayWithin"
                  type="number"
                  min="0"
                  className="mt-1.5"
                  value={birthdayWithinDays}
                  onChange={(e) => setBirthdayWithinDays(e.target.value)}
                  placeholder="e.g. 14"
                />
              </div>
            </div>
          </div>
          )}
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} {listType === "DYNAMIC" ? "Create segment" : "Create list"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
