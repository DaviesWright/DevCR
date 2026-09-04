"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Megaphone } from "lucide-react";
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
import { createMarketingCampaign } from "@/lib/actions/marketing";
import { formatCurrency, orEmpty } from "@/lib/utils";
import type { getMarketingCampaigns, getMarketingSegments, getMarketingPersonas, getMessageTemplates } from "@/lib/queries/marketing";

type Campaign = Awaited<ReturnType<typeof getMarketingCampaigns>>[number];
type SegmentOption = Pick<Awaited<ReturnType<typeof getMarketingSegments>>[number], "id" | "name" | "memberCount">;
type PersonaOption = Pick<Awaited<ReturnType<typeof getMarketingPersonas>>[number], "id" | "name">;
type TemplateOption = Pick<Awaited<ReturnType<typeof getMessageTemplates>>[number], "id" | "name" | "channel" | "subject" | "bodyText" | "bodyHtml">;

const NONE = "__none__";
const CHANNELS = ["EMAIL", "SMS", "WHATSAPP"];
const STATUS_VARIANT: Record<string, "secondary" | "success" | "warning" | "highlight"> = {
  DRAFT: "secondary",
  SCHEDULED: "warning",
  ACTIVE: "highlight",
  PAUSED: "warning",
  COMPLETED: "success",
};

export function CampaignsList({
  campaigns,
  segments,
  personas,
  templates,
  currentUserId,
}: {
  campaigns: Campaign[];
  segments: SegmentOption[];
  personas: PersonaOption[];
  templates: TemplateOption[];
  currentUserId: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/marketing/campaigns/${c.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Megaphone className="size-4 text-muted-foreground" />
                      <p className="font-heading text-base font-semibold text-foreground">{c.name}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.channel} · {orEmpty(c.segment?.name)}
                    {c.persona ? ` · ${c.persona.name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.messageCount} message{c.messageCount === 1 ? "" : "s"} sent
                    {c.budget ? ` · Budget ${formatCurrency(c.budget, c.currency)}` : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <NewCampaignSheet
        open={open}
        onOpenChange={setOpen}
        segments={segments}
        personas={personas}
        templates={templates}
        currentUserId={currentUserId}
      />
    </div>
  );
}

function NewCampaignSheet({
  open,
  onOpenChange,
  segments,
  personas,
  templates,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segments: SegmentOption[];
  personas: PersonaOption[];
  templates: TemplateOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [channel, setChannel] = React.useState("EMAIL");
  const [segmentId, setSegmentId] = React.useState(NONE);
  const [personaId, setPersonaId] = React.useState(NONE);
  const [templateId, setTemplateId] = React.useState(NONE);
  const [objective, setObjective] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const templatesForChannel = templates.filter((t) => t.channel === channel);
  const selectedTemplate = templateId === NONE ? null : templates.find((t) => t.id === templateId) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    const { campaignId } = await createMarketingCampaign({
      name,
      channel,
      segmentId: segmentId === NONE ? undefined : segmentId,
      personaId: personaId === NONE ? undefined : personaId,
      templateId: templateId === NONE ? undefined : templateId,
      objective,
      budget: budget ? Number(budget) : undefined,
      createdById: currentUserId,
    });
    setName("");
    setObjective("");
    setBudget("");
    setPending(false);
    onOpenChange(false);
    router.push(`/marketing/campaigns/${campaignId}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New campaign</SheetTitle>
          <SheetDescription>Sending is simulated — no email/SMS/WhatsApp provider is configured.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="campaignName">Name *</Label>
            <Input id="campaignName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => { setChannel(v); setTemplateId(NONE); }}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target segment</Label>
            <Select value={segmentId} onValueChange={setSegmentId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="No segment yet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.memberCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Persona</Label>
            <Select value={personaId} onValueChange={setPersonaId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="No persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {personas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="No template — use objective as body" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {templatesForChannel.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
                {selectedTemplate.subject && <p className="text-sm font-medium text-foreground">{selectedTemplate.subject}</p>}
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedTemplate.bodyText || selectedTemplate.bodyHtml}</p>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="campaignObjective">Objective / fallback message</Label>
            <Textarea id="campaignObjective" className="mt-1.5" value={objective} onChange={(e) => setObjective(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="campaignBudget">Budget (USD)</Label>
            <Input id="campaignBudget" type="number" min="0" className="mt-1.5" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Create campaign
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
