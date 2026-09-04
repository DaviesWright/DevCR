"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sendMarketingCampaign, duplicateMarketingCampaign } from "@/lib/actions/marketing";
import { relativeTime, orEmpty } from "@/lib/utils";
import type { getMarketingCampaignDetail } from "@/lib/queries/marketing";

type CampaignDetail = NonNullable<Awaited<ReturnType<typeof getMarketingCampaignDetail>>>;

const STATUS_VARIANT: Record<string, "info" | "success" | "highlight" | "warning" | "destructive"> = {
  DRAFT: "info",
  SENT: "highlight",
  DELIVERED: "success",
  OPENED: "success",
  CLICKED: "success",
  REPLIED: "success",
  FAILED: "destructive",
};

export function CampaignDetailView({ campaign, currentUserId }: { campaign: CampaignDetail; currentUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [replicating, setReplicating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function send() {
    setPending(true);
    setError(null);
    try {
      await sendMarketingCampaign(campaign.id, currentUserId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send this campaign.");
    } finally {
      setPending(false);
    }
  }

  async function replicate() {
    setReplicating(true);
    try {
      const { campaignId } = await duplicateMarketingCampaign(campaign.id, currentUserId);
      router.push(`/marketing/campaigns/${campaignId}`);
    } finally {
      setReplicating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">
          {campaign.channel} · Segment: {orEmpty(campaign.segment?.name)}
          {campaign.persona ? ` · ${campaign.persona.name}` : ""}
          {campaign.createdBy ? ` · Created by ${campaign.createdBy}` : ""}
        </p>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={replicate} disabled={replicating}>
            {replicating ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />} Replicate
          </Button>
          <Button size="sm" onClick={send} disabled={pending || !campaign.segment}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Send now
          </Button>
        </div>
      </div>

      {campaign.template && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Content preview — {campaign.template.name}</p>
            {campaign.template.subject && <p className="text-sm font-medium text-foreground">{campaign.template.subject}</p>}
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{campaign.template.bodyText || campaign.template.bodyHtml}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sent</p>
            <p className="text-xl font-semibold tabular-nums">{campaign.kpis.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Opened</p>
            <p className="text-xl font-semibold tabular-nums">{campaign.kpis.opened}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Clicked</p>
            <p className="text-xl font-semibold tabular-nums">{campaign.kpis.clicked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Replied</p>
            <p className="text-xl font-semibold tabular-nums">{campaign.kpis.replied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Open rate</p>
            <p className="text-xl font-semibold tabular-nums">{campaign.kpis.openRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaign.messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Nothing sent yet.
                </TableCell>
              </TableRow>
            ) : (
              campaign.messages.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm font-medium text-foreground">{m.customerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{orEmpty(m.subject)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.status] ?? "info"}>{m.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.sentAt ? relativeTime(m.sentAt) : "--"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
