"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  acknowledgeHandoff,
  logHandoffIntroduction,
  sendHandoffWelcome,
  scoreHandoffQuality,
} from "@/lib/actions/handoffs";
import { orEmpty, relativeTime } from "@/lib/utils";
import type { HandoffListItem } from "@/lib/queries/handoffs";

const STATUS_VARIANT: Record<string, "info" | "secondary" | "warning" | "highlight" | "success"> = {
  PENDING_ACK: "info",
  ACKNOWLEDGED: "secondary",
  INTRODUCED: "warning",
  WELCOMED: "highlight",
  COMPLETE: "success",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_ACK: "Pending ack",
  ACKNOWLEDGED: "Acknowledged",
  INTRODUCED: "Introduced",
  WELCOMED: "Welcomed",
  COMPLETE: "Complete",
};

type Option = { id: string; name: string };

export function HandoffsTable({ handoffs, assignableUsers }: { handoffs: HandoffListItem[]; assignableUsers: Option[] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const active = handoffs.find((h) => h.id === openId) ?? null;

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Consultant</TableHead>
            <TableHead>CX Lead</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Notified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {handoffs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No handoffs yet — closing a deal on the Sales Pipeline creates one automatically.
              </TableCell>
            </TableRow>
          ) : (
            handoffs.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="text-sm font-medium">{h.customerName}</TableCell>
                <TableCell className="text-sm">{h.unitNumber}</TableCell>
                <TableCell className="text-sm">{h.consultantName}</TableCell>
                <TableCell className="text-sm">{orEmpty(h.cxLeadName)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[h.status]} dot>
                    {STATUS_LABEL[h.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {h.ackOverdue ? (
                    <Badge variant="destructive">Ack overdue</Badge>
                  ) : h.welcomeOverdue ? (
                    <Badge variant="destructive">Welcome overdue</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{relativeTime(h.notifiedAt)}</TableCell>
                <TableCell className="text-right">
                  {h.status !== "COMPLETE" && (
                    <Button variant="ghost" size="sm" onClick={() => setOpenId(h.id)}>
                      <ArrowRight className="size-3.5" /> Advance
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <HandoffWizardSheet
        handoff={active}
        assignableUsers={assignableUsers}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function HandoffWizardSheet({
  handoff,
  assignableUsers,
  onClose,
}: {
  handoff: HandoffListItem | null;
  assignableUsers: Option[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const [cxLeadId, setCxLeadId] = React.useState("");
  const [dossierComplete, setDossierComplete] = React.useState(false);
  const [dossierNote, setDossierNote] = React.useState("");
  const [qualityScore, setQualityScore] = React.useState("");
  const [qualityNote, setQualityNote] = React.useState("");

  React.useEffect(() => {
    setCxLeadId("");
    setDossierComplete(false);
    setDossierNote("");
    setQualityScore("");
    setQualityNote("");
  }, [handoff?.id]);

  async function run(fn: () => Promise<void>) {
    setPending(true);
    await fn();
    router.refresh();
    setPending(false);
    onClose();
  }

  return (
    <Sheet open={!!handoff} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {handoff && (
          <>
            <SheetHeader>
              <SheetTitle>{handoff.customerName}</SheetTitle>
              <SheetDescription>
                Unit {handoff.unitNumber} · Handed off by {handoff.consultantName} · {relativeTime(handoff.notifiedAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-5">
              {handoff.status === "PENDING_ACK" && (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!cxLeadId) return;
                    run(() => acknowledgeHandoff(handoff.id, { cxLeadId, dossierComplete, dossierNote }));
                  }}
                >
                  <p className="text-sm text-muted-foreground">
                    Acknowledge receipt of this handover — review the dossier before claiming it.
                  </p>
                  <div>
                    <Label>CX Lead *</Label>
                    <Select value={cxLeadId} onValueChange={setCxLeadId}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Who's taking this?" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={dossierComplete} onCheckedChange={(v) => setDossierComplete(!!v)} id="dossierComplete" />
                    <Label htmlFor="dossierComplete" className="font-normal">
                      Dossier is complete (contact, unit, reservation form, deposit status, notes)
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="dossierNote">Queries for Sales (optional)</Label>
                    <Textarea id="dossierNote" className="mt-1.5" value={dossierNote} onChange={(e) => setDossierNote(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={pending || !cxLeadId}>
                    {pending && <Loader2 className="size-3.5 animate-spin" />} Acknowledge
                  </Button>
                </form>
              )}

              {handoff.status === "ACKNOWLEDGED" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Confirm the Sales Consultant has made a warm personal introduction to the client.
                  </p>
                  <Button disabled={pending} onClick={() => run(() => logHandoffIntroduction(handoff.id))}>
                    {pending && <Loader2 className="size-3.5 animate-spin" />} Log warm introduction
                  </Button>
                </div>
              )}

              {handoff.status === "INTRODUCED" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Send the client a formal welcome communication — SLA is 48 hours from handover.
                  </p>
                  <Button disabled={pending} onClick={() => run(() => sendHandoffWelcome(handoff.id))}>
                    {pending && <Loader2 className="size-3.5 animate-spin" />} Mark welcome sent
                  </Button>
                </div>
              )}

              {handoff.status === "WELCOMED" && (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const score = Number(qualityScore);
                    if (!score || score < 1 || score > 10) return;
                    run(() => scoreHandoffQuality(handoff.id, { score, note: qualityNote }));
                  }}
                >
                  <p className="text-sm text-muted-foreground">
                    Score this handover's quality (1–10) — feeds the Sales team's Handover Quality KPI.
                  </p>
                  <div>
                    <Label htmlFor="qualityScore">Score (1-10) *</Label>
                    <Input
                      id="qualityScore"
                      type="number"
                      min="1"
                      max="10"
                      className="mt-1.5"
                      value={qualityScore}
                      onChange={(e) => setQualityScore(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="qualityNote">Notes (optional)</Label>
                    <Textarea id="qualityNote" className="mt-1.5" value={qualityNote} onChange={(e) => setQualityNote(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={pending}>
                    {pending && <Loader2 className="size-3.5 animate-spin" />} Complete handoff
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
